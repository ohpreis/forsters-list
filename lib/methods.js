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
