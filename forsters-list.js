Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
    Meteor.publish("tasks", function(argument){
       return Tasks.find();
    });
}

if (Meteor.isClient) {

  Meteor.subscribe("tasks");

  // This code only runs on the client
	Template.todos.helpers({
		tasks: function() {
			return Tasks.find({
				standing: "open"
			});
		}
	});

  Template.closedTodos.helpers({
    closedTasks: function() {

			if (Session.get("sortCompleted")) {
				return Tasks.find({
					standing: {
						$in: ["closed", "dismissed"]
					}
				});
			} else {
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

  // Date format Mask
	var DateFormats = {
		short: "DD MMMM - YYYY",
		long: "dddd DD.MM.YYYY HH:mm"
	};

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

  // Helper to highlight dismissed items.
	UI.registerHelper("isDismissed", function(standing) {
		if (standing == "dismissed") {
			return "bg-warning";
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

      if (text.length <= 5) {
        alert("There ought to be some text, no?");
        return false;
      }

			// Insert a task into the collection
			Meteor.call("addTask", text);

			// clear the form for more
			event.target.text.value = "";
		}
	});

	Template.task.events({

	});

  Template.task.events({
    "click .btnDone": function(e) {
    	Meteor.call("completeTask", this._id);
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
    },
		"click .btnClose": function() {
			Meteor.call("closeTask", this._id);
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
		},
		"click .btnDismiss": function() {
			Meteor.call("dismissTask", this._id)
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
		}
  });

	Template.closedTask.events({
    "change .sort-it input": function(event) {
      Session.set("sortCompleted", event.target.checked);
    },
    "click .btnRevive": function() {
			Meteor.call("reviveTask", this._id);
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();

		},
		"click .btnDelete": function() {
			Meteor.call("deleteTask", this._id);
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
		}

	});

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_ONLY"
	});

  Template.body.onRendered = function () {
    $('head').append( '<meta name="viewport" content="width=device-width, initial-scale=1">' );
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
      touched: 0,
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
      touched: task.touched + 1, 
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
