Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {

    Meteor.publish("tasks", function(argument){
       return Tasks.find();
    });
    // Meteor.publish("closedTasks", function(argument){
    //    return Tasks.find();
    // });
}

if (Meteor.isClient) {

  Meteor.subscribe("tasks");
  // Meteor.subscribe("closedTasks");

  // This code only runs on the client
	Template.todos.helpers({
		tasks: function() {
			return Tasks.find({
				standing: "open"
			});
		}
	});

  Template.closedTask.helpers({
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
			return "bg-dismissed";
		} else {
			return "bg-closed";
		}
	});


	Template.body.events({

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

  // Template.body.onRendered = function() {
  //
  //   $(document).foundation("reveal", "reflow");
  //
  //   $(window).bind("load", function () {
  //     var footer = $("#footer");
  //     var pos = footer.position();
  //     var height = $(window).height();
  //     height = height - pos.top;
  //     height = height - footer.height();
  //     if (height > 0) {
  //       footer.css({
  //           'margin-top': height + 'px'
  //       });
  //     }
  //   });
  //
  // }

	Template.task.events({

	});

  Template.activeTodoActionButtons.events({
    "click .btnDone": function() {
    	Meteor.call("completeTask", this._id);
      $('#' + this._id).foundation('reveal', 'close');
    },
		"click .btnClose": function() {
			Meteor.call("closeTask", this._id);
      $('#' + this._id).foundation('reveal', 'close');
		},
		"click .btnDismiss": function() {
			Meteor.call("dismissTask", this._id)
      $('#' + this._id).foundation('reveal', 'close');
		}
  });

	Template.closedTask.events({
    "change .sort-it input": function(event) {
      Session.set("sortCompleted", event.target.checked);
    },
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

  Template.body.rendered = function () {
    $(document).foundation('reflow');
  }

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
    // $(document).foundation('reveal', 'reflow');
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
