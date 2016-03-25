// The task collection
Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {

    Meteor.publish("tasks", function(argument){

      return Tasks.find({ owner: this.userId }, {});

    });

    Meteor.startup(function(){

      // setup to send email
      smtp = {
          username: Meteor.settings.public.username,      // eg: server@gentlenode.com
          password: Meteor.settings.public.password,      // eg: 3eeP1gtizk5eziohfervU
          server:   Meteor.settings.public.server,        // eg: mail.gandi.net
          port: Meteor.settings.public.port               // eg: 587
      };
      process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port + '/';

      // configure accounts
      Accounts.config({
          sendVerificationEmail: true,
          forbidClientAccountCreation: false
      });

    });
}

if (Meteor.isClient) {

  Meteor.subscribe("tasks");

  console.log("This is it - " + Meteor.userId());

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

  Template.appsettings.helpers({

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
  UI.registerHelper("getSettings", function(whatsetting){

    console.log("The log " + whatsetting);

    if (whatsetting === "username") {
      return Meteor.settings.public.username;
    } else if (whatsetting === "password") {
      return Meteor.settings.public.password;
    } else if (whatsetting === "server") {
      return Meteor.settings.public.server;
    } else if (whatsetting === "port") {
      return Meteor.settings.public.port;
    }
    else if (whatsetting === "showsetup")
    {
      if (Meteor.settings.public.port === "" ||
          Meteor.settings.public.username === "" ||
          Meteor.settings.public.password === "" ||
          Meteor.settings.public.server === "") {
            return "block";
          } else {
            return "none";
          }

    }
    else if (whatsetting === "showdata")
    {
      if (Meteor.settings.public.port === "" ||
          Meteor.settings.public.username === "" ||
          Meteor.settings.public.password === "" ||
          Meteor.settings.public.server === "") {
            return "none";
          } else {
            return "block";
          }

    } else {
      return "undefinedstuff";
    }
  });

	Template.body.events({

		"submit .new-task": function(event) {

			// prevent default browser form submit
			event.preventDefault();

			// get the value from the form element
			var text = event.target.text.value;

      if (text.length <= 3) {
        alert("There ought to be some text, no?");
        return false;
      }

			// Insert a task into the collection
			Meteor.call("addTask", text);

			// clear the form for more
			event.target.text.value = "";
		},
    "click .settings": function(event) {
      $(".settings-container").toggle("slow");
      $(".content-wrapper").toggle("slow");
      return false;
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
  closeTask: function(taskID, note) {
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskID, {
      $set: {
        standing: "closed",
        deletedAt: new Date(),
        notes: note
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
