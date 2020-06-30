const express= require("express");
const app= express();
require("dotenv").config();
const mongo= process.env.MONGOLINK;
const mongoose= require("mongoose");
mongoose.connect("mongodb+srv://"+mongo+"?retryWrites=true&w=majority",{ useNewUrlParser: true,useUnifiedTopology: true});
const bodyParser= require("body-parser");
const request= require("request");
var User= require("./models/user");
var passport= require("passport");
var LocalStrategy= require("passport-local");
var passportLocalMongoose= require("passport-local-mongoose");


app.use(require("express-session")({
  secret:"i am not a robot",
  resave:false,
  saveUninitialized:false
}));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
  res.locals.currentUser=req.user;
  next();
})
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const api_key=process.env.API_KEY;
app.get("/",function(req,res){

  res.render("weatherhtml");
});
app.post("/",function(req,res){
  var data= req.body.search;
  var finalData=capitalizeFirstLetter(data);
  request("http://api.openweathermap.org/data/2.5/weather?q="+finalData+"&units=metric&appid="+api_key,function(error,respose,body){
      if(!error && respose.statusCode==200){
          var parsedData= JSON.parse(body);
          var tempToday=parsedData['main']['temp'];
          var minTemp= parsedData['main']['temp_min'];
          var maxTemp= parsedData["main"]["temp_max"];
          var description = parsedData['weather'][0]['description'];
          var atmos= capitalizeFirstLetter(description);
          res.render("results",{tempToday:tempToday, location: finalData,minTemp:minTemp,maxTemp: maxTemp, atmos: atmos});
          // console.log(parsedData["list"]["weather"]["main"]);
      }
  });
});
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
app.get("/signUp",function(req,res){
  res.render("signUp");
});
app.post("/signUp",function(req,res){
  User.register(new User({username:req.body.username}),req.body.password,function(err,user){
    if(err){
      console.log(err);
    }else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/");
      })
    }
  })
});
app.get("/login",function(req,res){
  res.render("login");
});
app.post("/login",passport.authenticate("local",{
  successRedirect:"/",
  failureRedirect:"/login"
}),function(req,res){

});
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})

app.listen(process.env.PORT, process.env.IP);
// app.listen("3000",function(){
//   console.log("server started");
// })
