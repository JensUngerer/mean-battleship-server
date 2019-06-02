import { Application, Response, Request } from 'express';
import express from 'express';
import { Server } from 'http';
import http from 'http';
import socketIo, { Socket } from 'socket.io';
import path from 'path';

import { Communication } from './communication';

import { ConfigSocketIo } from './../../common/src/config/configSocketIo';
import { SocketIoSendTypes } from './../../common/src/communication/socketIoSendTypes';
import { SocketIoReceiveTypes } from '../../common/src/communication/socketIoReceiveTypes';

import { IMessage } from '../../common/src/communication/message/iMessage';
import { ICoordinatesMessage } from './../../common/src/communication/message/iCoordinatesMessage';
import { ITileStateMessage } from './../../common/src/communication/message/iTileStateMessage';

export class App {
    private express: Application;
    private server: Server;
    private io: socketIo.Server;
    private socket: Socket;

    private socketIdUserId: { [key: string]: string } = {};
    private communication: Communication;

    constructor() {
        this.express = express();
        this.server = http.createServer(this.express);
        // const options: socketIo.ServerOptions = {};
        this.io = socketIo(this.server);
        this.communication = new Communication(this.io);
    }

    public configureExpress() {
        const absolutePathToAppJs = process.argv[1];
        const relativePathToAppJs: string = './../../client/dist/client';
        const pathStr: string = path.resolve(absolutePathToAppJs, relativePathToAppJs);

        // DEBUGGING:
        console.log(pathStr);

        this.express.use(express.static(pathStr));

        // https://stackoverflow.com/questions/25216761/express-js-redirect-to-default-page-instead-of-cannot-get
        // https://stackoverflow.com/questions/30546524/making-angular-routes-work-with-express-routes
        // https://stackoverflow.com/questions/26917424/angularjs-and-express-routing-404
        // https://stackoverflow.com/questions/26079611/node-js-typeerror-path-must-be-absolute-or-specify-root-to-res-sendfile-failed
        this.express.get('*', (request: Request, response: Response) => {
            // DEBUGGING:
            // console.log(request.url);
            // console.log(pathStr);
            response.sendFile('index.html', { root: pathStr });
        });
    }

    public listen(port: number) {

        this.server.listen(port, () => {
            // DEBUGGING:
            console.log('listening on:' + port);
        });

        this.io.on(ConfigSocketIo.SOCKET_IO_CONNECT_ID, (socket: Socket) => {
            // DEBUGGING:
            console.log('client connected on port:' + port);

            this.socket = socket;
            const socketId: string = socket.id;

            socket.on(ConfigSocketIo.SOCKET_IO_DISCONNECT_ID, () => {
                // DEBUGGING:
                console.log('client disconnected on port:' + port);

                this.communication.removeUser(this.socketIdUserId[socketId]);
                delete this.socketIdUserId[socketId];
            });

            socket.on(SocketIoSendTypes.StartGame, (incomingMessage: IMessage) => {
                // this.debugPrintMessage(incomingMessage);
                const userId: string = incomingMessage.sourceUserId;
                this.socketIdUserId[userId] = userId;
                this.communication.addUser(userId, socketId);
            });

            socket.on(SocketIoSendTypes.Coordinates, (incomingMessage: ICoordinatesMessage) => {
                // this.debugPrintMessage(incomingMessage);
                incomingMessage.type = SocketIoReceiveTypes.Coordinates;
                this.communication.emit(incomingMessage);
            });

            socket.on(SocketIoSendTypes.TileState, (incomingMessage: ITileStateMessage) => {
                // this.debugPrintMessage(incomingMessage);
                incomingMessage.type = SocketIoReceiveTypes.TileState;
                this.communication.emit(incomingMessage);
            });

            socket.on(SocketIoSendTypes.RemainingTileState, (incomingMessage: ITileStateMessage) => {
                // this.debugPrintMessage(incomingMessage);
                incomingMessage.type = SocketIoReceiveTypes.RemainingTileState;
                this.communication.emit(incomingMessage);
            });

            socket.on(SocketIoSendTypes.GameWon, (incomingMessage: IMessage) => {
                // this.debugPrintMessage(incomingMessage);
                incomingMessage.type = SocketIoReceiveTypes.GameWon;
                this.communication.emit(incomingMessage);
            });
        });
    }

    public shutdown(): Promise<boolean> {
        return new Promise<boolean>((resolve: (value: boolean) => void, reject: (value: any) => void) => {
            // https://stackoverflow.com/questions/18126677/node-js-socket-io-close-client-connection
            if (this.socket) {
                this.socket.disconnect(true);
            }
            // https://hackernoon.com/graceful-shutdown-in-nodejs-2f8f59d1c357
            this.server.close((err: Error) => {
                if (err) {
                    console.error('error when closing the http-server');
                    // console.error(err);
                    // console.error(JSON.stringify(err, null, 4));
                    reject(err);
                    return;
                }
                console.error('http-server successfully closed');

                this.io.close(() => {
                    console.error('socketIO.server closed');


                });

                resolve(true)
            });
        });
    }

    private debugPrintMessage(msg: IMessage) {
        console.log('incoming-message');
        console.log(JSON.stringify(msg, null, 4));
    }
}
