Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
    Meteor.publish("tasks", function(argument){
       return Tasks.find({}, {});
    });
}

if (Meteor.isClient) {

  Meteor.subscribe("tasks");

  // This code only runs on the client
	Template.todos.helpers({
		tasks: function() {
			return Tasks.find({ standing: "open", type: "todo"}, {sort: {createdAt: 1}});
		}
	});

  Template.todoCount.helpers ({
    theCount: function() {
      return Tasks.find({standing: "open", type: "todo"}).count();
    }
  });
  Template.ideaCount.helpers ({
    theCount: function() {
      return Tasks.find({type: "idea"}).count();
    }
  });
  Template.doneTodoCount.helpers ({
    theCount: function() {
      return Tasks.find(
      {
        standing:
        {
          $in: ["closed", "dismissed"]
        },
        type: "todo"
      }).count();
    }
  });
  Template.closedTodos.helpers({
    closedTasks: function() {

				return Tasks.find(
        {
					standing:
          {
						$in: ["closed", "dismissed"]
					},
          type: "todo"
				},
        {
					sort:
          {
						deletedAt: -1
					},
          limit: 40
				});

		}
  });
  Template.ideas.helpers({
    items: function() {
      return Tasks.find( {type: "idea"}, {sort: {createdAt: -1}});
    }
  });

  // Date format Mask
	var DateFormats = {
		short: "DD MMMM - YYYY",
		long: "dddd DD.MM.YYYY HH:mm"
	};

	// Format the date
	UI.registerHelper("formatDate", function(datetoformat, format) {
		if (moment) {
			// can use other formats like 'lll' too
			format = DateFormats[format] || format;
			return moment(datetoformat).format(format);
		} else {
			return datetoformat;
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

    "click .btnDone": function(event, template) {
    	Meteor.call( "completeTask", this._id, template.find(".notes_field").value );
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
    },
		"click .btnClose": function(event, template) {
			Meteor.call("closeTask", this._id, template.find(".notes_field").value);
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
		},
		"click .btnDismiss": function(event, template) {
			Meteor.call("dismissTask", this._id, template.find(".notes_field").value)
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
		},
    "click .btnMoveToIdeas": function(event, template) {
      Meteor.call("moveToIdeas", this._id, template.find(".notes_field").value);
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

  Template.idea.events({
    "click .btnMoveFromIdeas": function() {
      Meteor.call("moveFromIdeas", this._id);
      $("#" + this._id).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
    },
    "click .btnSaveNotes": function (event, template) {
      Meteor.call("saveNotes", this._id, template.find(".notes_field").value);
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
      passwordSignupFields: "USERNAME_AND_EMAIL",
      requestPermissions: {},
      extraSignupFields: [{
          fieldName: 'terms',
          fieldLabel: 'I accept the terms and conditions',
          inputType: 'checkbox',
          visible: true,
          saveToProfile: false,
          validate: function(value, errorFunction) {
              if (value) {
                  return true;
              } else {
                  errorFunction('You must accept the terms and conditions.');
                  return false;
              }
          }
      }]
  });

  Template.body.onRendered = function () {
    $('head').append( '<meta name="viewport" content="initial-scale = 1.0,maximum-scale = 1.0">' );
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
      notes: "",
      standing: "open",
      type: "todo",
      createdAt: new Date(),
      deletedAt: "",
      touched: 0,
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  completeTask: function(taskID, notes) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    var task = Tasks.findOne(taskID);
    Tasks.remove(taskID);
    Tasks.insert({
      text: task.text,
      notes: notes,
      standing: "open",
      type: task.type,
      createdAt: new Date(),
      deletedAt: "",
      touched: task.touched + 1,
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  saveNotes: function(taskID, note) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update({_id: taskID}, {$set:{ notes: note }});
  },
  moveToIdeas: function(taskID) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update({_id: taskID}, {$set: {type: "idea", standing: "open"}});
  },
  moveFromIdeas: function(taskID) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update({_id: taskID}, {$set: {type: "todo", standing: "open"}});
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
Meteor.startup(function(){
  // setup to send email
  smtp = {
      username: 'postmaster@sandbox82121.mailgun.org',       // eg: server@gentlenode.com
      password: '7t9bg7q6xym1',     // eg: 3eeP1gtizk5eziohfervU
      server:   'sandbox82121.mailgun.org',       // eg: mail.gandi.net
      port: 587
  };
  process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port + '/';

  // configure accounts
  Accounts.config({
      sendVerificationEmail: true,
      forbidClientAccountCreation: true
  });

});
