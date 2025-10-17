import express from "express";

const router = express.Router();


router.post("/signup", ()=>{
    res.send("Signup endpoint");
});
router.post("/login", ()=>{
    res.send("login endpoint")});
router.post("/logout",()=>{
    res.send("logout endpoint")});


export default router;
