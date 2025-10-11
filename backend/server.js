// const express = require('express');
import express from 'express';

const app = express();

app.get("/api/auth/signup", (req,res) => {
    res.send("Signup endpoint");
});

app.get("/api/auth/login", (req,res) => {
    res.send("login endpoint");
});

app.get("/api/auth/login", (req,res) => {
    res.send("login endpoint");
});


app.listen(3000, () => {
    console.log("Server is running on port 3000..");
});