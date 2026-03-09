import {io} from "socket.io-client";

const socket=io("http://localhost:5001",{
withCredentials:true,
transports:["websocket"],
autoConnect:true
});

export default socket;