import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import {io} from "socket.io-client"
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
export const AuthContext = createContext();

export const AuthProvider = ({ children})=>{

    const [token, setToken]= useState(localStorage.getItem("token"))
    const [authUser,setAuthUser] = useState(null);
    const [onlineUsers,setOnlineUser] = useState([]);
    const [socket,setSocket] = useState(null);

    // check if the user is authenticated and if so ,set the user data and connect the socket 
    const checkAuth = async()=>{
         try {
            const {data}= await axios.put("/api/auth/check")
            if(data.success){
                 setAuthUser(data.user)
                 connectSocket(data.user)
            }
         } catch (error) {
            toast.error(error.message);
            
         }
    }
    //login function to handle user authentication and socket connection

    const login= async(state,credentials)=>{
         try {
             const {data} =await axios.post(`/api/auth/${state}`,credentials);
             if(data.success){
                 setAuthUser(data.userData);
                 connectSocket(data.userData);
                 axios.defaults.headers.common["token"] = data.token;
                 setToken(data.token);
                 localStorage.setItem("token",data.token);
                 toast.success(data.message);
             }
             else{
                 toast.error(error.message);

             }
         } catch (error) {
            toast.error(error.message);
         }
    }
// logout funtion to handle user logout and socket disconnection 

    const logout = async ()=>{
         localStorage.removeItem("token");
         setToken(null);
         setAuthUser(null);
         setOnlineUser([]);
         axios.defaults.headers.common["token"] = null;
         toast.success("Logged Out Successfully")
         socket.disconnect();
    }

    // upadte profile function to handle user profile updates

    const updateProfile = async(body)=>{
         
            try {
                // console.log(body);
                const {data} = await axios.put("/api/auth/update-profile",body)
                console.log("Update response:", data);
                console.log("upadat response ");
                if(data.success){
                     setAuthUser(data.user);
                     toast.success("Profile Updated Successfully");
                }else{
                     toast.error("not updated");
                }

            } catch (error) {
                
                toast.error(error.message);
            }
    }

    // Connect socket function to handle socket connection and online users updates
    const connectSocket = (userData)=>{
         if(!userData || socket?.connected) return;
         const newSocket = io(backendUrl,{
            query:{
                userId: userData._id,

            }
         });
         newSocket.connect();
         setSocket(newSocket);
         newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUser(userIds);
         })
    }

    useEffect(()=>{
         if(token){
             axios.defaults.headers.common["token"] = token;
             checkAuth();

         }
    },[])
    useEffect(() => {
  if (socket) {
    socket.on("getOnlineUsers", (users) => {
      setOnlineUser(users); // ✅ Update real-time
    });
  }

  return () => {
    if (socket) socket.off("getOnlineUsers");
  };
}, [socket]);

    const value= {
         axios,
         authUser,
         onlineUsers,
         socket,
         login,
         logout,
         updateProfile

    }
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}