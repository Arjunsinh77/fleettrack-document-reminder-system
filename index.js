const express = require("express");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const userModel = require('./model/User')
const taskModel = require('./model/task')

const multerconfig=require('./config/multerconfig')

const cookieParser = require('cookie-parser');

const cron = require("node-cron");
const nodemailer = require("nodemailer");

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/upload', isLoggedIn, async (req, res) => {
    res.render("upload");
})

app.post('/upload',isLoggedIn,multerconfig.single('file'),async(req,res)=>{
   const user=await userModel.findOne({email:req.user.email});
   user.profilepic=req.file.filename;
   await user.save();
   res.redirect("/profile")
})

app.get('/dashboard', isLoggedIn, async (req, res) => {

    let trucks = await taskModel.find({
        userId: req.user.id
    });

    let user = await userModel.findById(req.user.id);

    // COUNTS
    let v = 0;
    let ex = 0;
    let soon = 0;

    let today = new Date();

    trucks.forEach(truck => {

        if (!truck.insurance) return;

        let diff = Math.ceil(
            (new Date(truck.insurance) - today)
            / (1000 * 60 * 60 * 24)
        );

        if (diff < 0) {
            ex++;
        }
        else if (diff <= 4) {
           soon++;
        }
        else {
            v++;
        }

    });

    res.render("dashboard", {
        trucks,
        user,
        v,
        ex,
        soon
    });
});
app.get('/', function (req, res) {
    res.render("login")
})

app.get('/profile', isLoggedIn, async function (req, res) {
    let user = await userModel.findById(req.user.id);
    res.render("profile", { user });
})

app.get('/sign', function (req, res) {
    res.render("signup");
})
app.post("/signup", async (req, res) => {

    let { username, email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (user) return res.send("User already exists");

    bcrypt.genSalt(10, (err, salt) => {

        bcrypt.hash(password, salt, async (err, hash) => {

            let newUser = await userModel.create({
                username,
                email,
                password: hash
            });

            const token = jwt.sign(
                { id: newUser._id, email: newUser.email },
                "secret"
            );

            res.cookie("token", token);

            res.redirect("/dashboard");

        });

    });

})

app.post("/login", async (req, res) => {

    let { email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) return res.send("User not found");

    bcrypt.compare(password, user.password, (err, result) => {

        if (result) {

            const token = jwt.sign(
                { id: user._id, email: user.email },
                "secret"
            );

            res.cookie("token", token);

            res.redirect("/dashboard");

        }
        else {
            res.send("Wrong Password");
        }

    });

});



app.get("/add", isLoggedIn, (req, res) => {
    res.render("add");
});

app.post('/add', isLoggedIn, async (req, res) => {
    let { truckNo, owner, mobile, insurance } = req.body;

    await taskModel.create({
        truckNo,
        owner,
        mobile,
        insurance,
        userId: req.user.id
    });

    res.redirect("/dashboard");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {

    let truck = await taskModel.findById(req.params.id);

    res.render("edit", { truck });
});

app.post("/edit/:id", isLoggedIn, async (req, res) => {

    let { truckNo, owner, mobile, insurance } = req.body;

    await taskModel.findByIdAndUpdate(req.params.id, {
        truckNo,
        owner,
        mobile,
        insurance
    });

    res.redirect("/dashboard");
});

app.post("/delete/:id", isLoggedIn, async (req, res) => {

    await taskModel.findByIdAndDelete(req.params.id);

    res.redirect("/dashboard");
});


app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/");
});


// middlware
function isLoggedIn(req, res, next) {

    if (!req.cookies.token) return res.redirect("/");

    try {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    }
    catch (err) {
        res.redirect("/")
    }

}
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "arjaunsinh848@gmail.com",
        pass: "ffqx xwaq nvhw rnbx"
    }
});
cron.schedule("* * * * *", async () => {
    console.log("⏰ Checking expiry alerts...");

    let today = new Date();

    let trucks = await taskModel.find().populate("userId");

    for (let truck of trucks) {

        if (!truck.insurance) continue;

        let expiry = new Date(truck.insurance);

        let diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diff <= 4 && diff >= 0 && !truck.alertSent) {

            console.log(`⚠️ Alert: ${truck.truckNo}`);

            try {
                await transporter.sendMail({
                    from: "arjaunsinh848@gmail.com",
                    to: "arjaunsinh848@gmail.com",   
                    subject: "🚛 Truck Insurance Expiry Alert",
                    text: `Truck ${truck.truckNo} insurance expires in ${diff} days.`
                });

                // mark as sent
                await taskModel.findByIdAndUpdate(truck._id, {
                    alertSent: true
                });

            } catch (err) {
                console.log("Email error:", err);
            }
        }
    }
});


app.listen(3000, () => console.log("Server running"));