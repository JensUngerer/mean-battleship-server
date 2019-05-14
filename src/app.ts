import { Application, Response, Request } from 'express';
import express from 'express';
import { Server } from 'http';
import http from 'http';
import socketIo from 'socket.io';
import path from 'path';

export class App {
    private express: Application;
    private server: Server;
    private io: socketIo.Server;

    constructor() {
        this.express = express();
        this.server = http.createServer(this.express);
        this.io = socketIo(this.server);
    }

    public configureProvidedDist(relativePath: string) {
        const pathStr = path.resolve(relativePath);

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


        // this.express.get('*', (request: Request, response: Response) => {
        //     response.redirect('/');
        // });
    }

    public listen(port: number) {

        this.server.listen(port, () => {
            // DEBUGGING:
            console.log('listening on:' + port);
        });
    }
}
