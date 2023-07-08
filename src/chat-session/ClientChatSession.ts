

export class ClientChatSession {
    public id : string;
    public ipAddress : string;
    public userId? : string;
    constructor(id : string, ipAddress : string, userId? : string) {
        this.id = id;
        this.ipAddress = ipAddress;
        this.userId = userId;
    }
}