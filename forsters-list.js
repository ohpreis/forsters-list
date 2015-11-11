Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
	  tasks: function() {
		  return Tasks.find({standing: "open"});
	  }, 
	  closedTasks: function() {
		  
		  if (Session.get("sortCompleted")) {
		  	 return Tasks.find({standing: "closed"});
		  } else {
		  	return Tasks.find({standing: "closed"}, {sort: {deletedAt: -1}});
		  }
		  
	  }, 
	  sortCompleted: function() {
		  return Session.get("sortCompleted");
	  }
  });
  
  var DateFormats = {
         short: "DD MMMM - YYYY",
         long: "dddd DD.MM.YYYY HH:mm"
  };
  
  // Use UI.registerHelper..
  UI.registerHelper("formatDate", function(deletedAt, format) {
    if (moment) {
      // can use other formats like 'lll' too
      format = DateFormats[format] || format;
      return moment(deletedAt).format(format);
    }
    else {
      return deletedAt;
    }
  });
  
  // UI.registerHelper("formatURL", function(text) {
  //
  // 	  return linkifyStr(text, { defaultProtocol: 'http'});
  //
  // });
  
  Template.body.events({
	  
	  // Add a new To-do
	  "submit .new-task": function(event) {
	  	// prevent default browser form submit
		  event.preventDefault();
		  
		  // get the value from the form element
		  var text = event.target.text.value;
		  
		  if (text.lenght >= 3) {
			  alert("That is a to short to do! Don't you think so?");
			  return false;
		  }
		  
		  // insert the task into the collection
		  Tasks.insert({
			  text: text, 
			  standing: "open", 
			  createdAt: new Date(), 
			  deletedAt: ""
		  });
		  
		  // clear the form for more
		  event.target.text.value = "";
	  }, 
	  "change .sort-it input": function(event) {
		  Session.set("sortCompleted", event.target.checked);
	  }
  });

  
  Template.task.events({
	  "click .btnDone": function() {
		  var task = Tasks.findOne(this._id);
		  Tasks.remove(this._id);
		  Tasks.insert({
			  text: task.text, 
			  standing: "open", 
			  createdAt: new Date(), 
			  deletedAt: ""
		  }); 
	  }, 
	  "click .btnClose": function() {
		  Tasks.update( this._id, {$set: {standing: "closed", deletedAt: new Date()} });
	  }, 
	  "click .getFocus": function(e) {
		  
		  var target = $(e.target);
		  if ( target.is("a") ) {
			  target.click();
			  return false;
		  }

		  
		  $(".getFocus").removeClass("doubleFocus").children().hide();

		  if ($(e.target).hasClass("doubleFocus")) {
			  $(e.target).children().toggle() ;
			  $(e.target).removeClass("doubleFocus");
		  }
		  else
		  {
			  $(e.target).children().toggle() ;
			  $(e.target).addClass("doubleFocus");
			  $(e.target).linkify({target: "_blank"});
		  }
		  
		  return false;
	  }, 
	  "click .doubleFocus": function(e) {
		  $(e.target).removeClass("doubleFocus").children().hide();
	  }
  });
  
  Template.closedTask.events({
  	
	  "click .btnRevive": function() {
		  Tasks.update( this._id, {$set: {standing: "open", deletedAt: ""} });
		  
	  }, 
	  "click .btnDelete": function() {
		  Tasks.remove(this._id);
	  }
	
  });
  
}



if (Meteor.isServer) {
	
	Meteor.startup(function() {
		if (Tasks.find().count() === 0) {
			Tasks.insert({text: "First one todo", standing: "open", createdAt: new Date(), deletedAt: "" });
			Tasks.insert({text: "A deleted one todo", standing: "closed", createdAt: new Date(), deletedAt: new Date() });
			Tasks.insert({text: "Going to the read.", standing: "open", createdAt: new Date(), deletedAt: "" });
			Tasks.insert({text: "When will I be able to start using this?", standing: "open", createdAt: new Date(), deletedAt: "" });
		}
	});
	
}


