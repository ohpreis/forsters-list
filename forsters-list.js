Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {

    Meteor.publish("tasks", function(argument){
       return Tasks.find();
    });
    Meteor.publish("closedTasks", function(argument){
       return Tasks.find();
    });
}

if (Meteor.isClient) {

  Meteor.subscribe("tasks");
  Meteor.subscribe("closedTasks");

  // This code only runs on the client
	Template.body.helpers({
		tasks: function() {
			return Tasks.find({
				standing: "open"
			});
		},
		closedTasks: function() {

			if (Session.get("sortCompleted")) {
				// return Tasks.find({standing: "closed"});
				return Tasks.find({
					standing: {
						$in: ["closed", "dismissed"]
					}
				});
			} else {
				// return Tasks.find({ standing: "closed"}, {sort: {deletedAt: -1}});
				return Tasks.find({
					standing: {
						$in: ["closed", "dismissed"]
					}
				}, {
					sort: {
						deletedAt: -1
					}
				});
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

	// Use UI.registerHelper...
	// Format the date
	UI.registerHelper("formatDate", function(deletedAt, format) {
		if (moment) {
			// can use other formats like 'lll' too
			format = DateFormats[format] || format;
			return moment(deletedAt).format(format);
		} else {
			return deletedAt;
		}
	});

	UI.registerHelper("isDismissed", function(standing) {
		if (standing == "dismissed") {
			return "bg-warning";
		} else {
			return "";
		}
	});

	Template.body.events({
    "change .sort-it input": function(event) {
      Session.set("sortCompleted", event.target.checked);
    },
		"submit .new-task": function(event) {

			// prevent default browser form submit
			event.preventDefault();

			// get the value from the form element
			var text = event.target.text.value;

			// Insert a task into the collection
			Meteor.call("addTask", text);

			// clear the form for more
			event.target.text.value = "";
		}
	});


	Template.task.events({

		"click .btnDone": function() {
			Meteor.call("completeTask", this._id);
		},
		"click .btnClose": function() {
			Meteor.call("closeTask", this._id);
		},
		"click .btnDismiss": function() {
			Meteor.call("dismissTask", this._id)
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
			Meteor.call("reviveTask", this._id);

		},
		"click .btnDelete": function() {
			Meteor.call("deleteTask", this._id);
		}

	});

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_ONLY"
	});
} // End of is client

Meteor.methods({
  addTask: function(text) {
    // Make sure the user is logged in before inserting a task
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    // insert the task into the collection
    Tasks.insert({
      text: text,
      standing: "open",
      createdAt: new Date(),
      deletedAt: "",
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  completeTask: function(taskID) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    var task = Tasks.findOne(taskID);
    Tasks.remove(taskID);
    Tasks.insert({
      text: task.text,
      standing: "open",
      createdAt: new Date(),
      deletedAt: "",
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  closeTask: function(taskID) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskID, {
      $set: {
        standing: "closed",
        deletedAt: new Date()
      }
    });
  },
  dismissTask: function(taskID) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskID, {
      $set: {
        standing: "dismissed",
        deletedAt: new Date()
      }
    });
  },
  deleteTask: function(taskID) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.remove(taskID);
  },
  reviveTask: function(taskID) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskID, {
      $set: {
        standing: "open",
        deletedAt: ""
      }
    });
  }
});
