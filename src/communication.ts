import { IMessage } from './../../common/src/communication/message/iMessage';
import { SocketIoReceiveTypes } from './../../common/src/communication/socketIoReceiveTypes';
import socketIo from 'socket.io';

export class Communication {
  private readonly NO_GAME_PARTNER_FOUND = '';
  private readonly NO_MATCHING_GAME_PARTNER = '';
  private userIdSocketId: any = {};
  private usersMap: any = {};

  constructor(private io: socketIo.Server) {}

  public emit(msg: IMessage) {
    this.debugPrint(msg);

    msg.targetUserId = this.getTargetUser(msg.sourceUserId);
    // http://stackoverflow.com/questions/24041220/sending-message-to-a-specific-id-in-socket-io-1-0
    const targetSocketId: string = this.userIdSocketId[msg.targetUserId];
    this.io.to(targetSocketId).emit(msg.type, msg);
  }

  public addUser(userId: string, socketId: string) {
    this.userIdSocketId[userId] = socketId;
    const foundGamePartner = this.searchMatchingGamePartner(userId);
    if (foundGamePartner === this.NO_GAME_PARTNER_FOUND) {
      this.usersMap[userId] = this.NO_MATCHING_GAME_PARTNER;
    } else {
      const beginningUserByGamble = this.gambleBeginningUser(
        userId,
        foundGamePartner
      );
      const msg: IMessage = {
        type: SocketIoReceiveTypes.BeginningUser,
        targetUserId: beginningUserByGamble,
        sourceUserId: userId
      };
      this.emit(msg);
    }
  }

  public removeUser(userId: string, socketId?: string) {
    const gamePartnerUserId = this.usersMap[userId];
    delete this.usersMap[userId];
    if (this.usersMap.hasOwnProperty(gamePartnerUserId)) {
      this.usersMap[gamePartnerUserId] = this.NO_MATCHING_GAME_PARTNER;
    }
    if (this.userIdSocketId[userId]) {
      delete this.userIdSocketId[userId];
    }
  }

  public getTargetUser(sourceUser: string) {
    return this.usersMap[sourceUser];
  }

  private gambleBeginningUser(userId: string, foundGamePartner: string) {
    const gamePartners = [userId, foundGamePartner];
    const randomBoolean = Math.random() >= 0.5;
    const randomInt = randomBoolean ? 1 : 0;
    return gamePartners[randomInt];
  }

  private searchMatchingGamePartner(userId: string): string {
    for (const user in this.usersMap) {
      if (this.usersMap.hasOwnProperty(user)) {
        if (this.usersMap[user] === this.NO_MATCHING_GAME_PARTNER) {
          this.usersMap[user] = userId;
          this.usersMap[userId] = user;
          return user;
        }
      }
    }
    return this.NO_GAME_PARTNER_FOUND;
  }

  private debugPrint(msg: IMessage) {
    console.log('outgoing-message:')
  	console.log(JSON.stringify(msg, null, 4));   
  }
}
