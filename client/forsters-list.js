
if (Meteor.isClient) {

  Meteor.subscribe("tasks");
  Meteor.subscribe("AllDoneTasks");

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
      return AllDoneTasks.count();
    }
  });
  Template.closedTodos.helpers({
    closedTasks: function() {
				return AllDoneTasks;
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

      if (text.length <= 3) {
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
