const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const colors = require("colors");
const userRoutes=require("./routes/userRoutes");
const chatRoutes=require("./routes/chatRoutes");
const messageRoutes=require("./routes/messageRoutes");
const {notFound,errorHandler}=require("./middleware/errorMiddleware");
const path = require("path");

const cors = require("cors");
dotenv.config();
connectDB();
const app = express();

app.use(express.json());//to accept json database
app.use(cors());


app.get("/",(req,res)=>{
    res.setHeader("Access-Control-Allow-Headers","true");
    res.send("API is Running Successfully ");
});

app.use("/api/user",userRoutes); 
app.use("/api/chat",chatRoutes);
app.use("/api/message",messageRoutes);




// -------------------Deployment----------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(5000,console.log(`Server started on PORT ${PORT}`.yellow.bold));

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://mern-messenger.onrender.com",
    // credentials: true,
  },
});

io.on("connection",(socket)=>{
    console.log("connected to socket.io");

    socket.on("setup", (userData)=>{
        socket.join(userData._id);
        //console.log(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat",(room)=>{
        socket.join(room);
        console.log("User Joined Room: " + room);
    });

      socket.on("typing", (room) => socket.in(room).emit("typing"));
       socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageRecieved) => {
        var chat =newMessageRecieved.chat;
        if(!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if(user._id == newMessageRecieved.sender._id) return;
          socket.in(user._id).emit("message recieved", newMessageRecieved);  
        });
    });

    socket.off("setup",()=>{
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});

  
