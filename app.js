//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-pablo:Test123@cluster0.cpchmyp.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this box to delete an item.",
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find({})
    .then((items) => {
      if(items.length === 0){
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Default items saved to DB successfully")
          })
          .catch((err) => {
            console.log(err)
          });
        
      } else {
        res.render("list", {listTitle: "Today", newListItems: items});
      }
    })
    .catch((err) => {
      console.log(err)
    });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if(listName === "Today"){
    item.save()
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save()
          .then(() => {
            console.log("New custom item saved");
          })
          .catch((err) => {
            console.log(err);
          });
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if(!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
      
        list.save()
          .then(() => {
            console.log("Successfully created list");
          })
          .catch((err) => {
            console.log(err);
          });
        
          res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    })
    .catch((err) => {
      console.log(err);
    });

});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId)
    .then(() => {
      res.redirect("/");
      console.log("Item deleted from database successfully");
    })
    .catch((err) => {
      console.log(err);
    });
  } else {
    List.findOneAndUpdate(
      {name: listName}, 
      {$pull: {items: {_id: checkedItemId}}})
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});