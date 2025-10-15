import express from "express";

const router = express.Router();

 

router.post("/send",(req,res)=>{
    res.send("Message sent");
});

export default router;
