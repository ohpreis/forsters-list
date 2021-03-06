if (Meteor.isServer) {

    Meteor.publish("tasks", function(argument){

      return Tasks.find({ owner: this.userId }, {});

    });
    // this.Pages = new Meteor.Pagination(Tasks);

    Meteor.startup(function(){

      // setup to send email
      smtp = {
          username: ''          //eg: server@gentlenode.com
          password: '',                          // eg: 3eeP1gtizk5eziohfervU
          server:   '',                         // eg: mail.gandi.net
          port:     '587'                                       // eg: 587
      };
      process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port + '/';

      // configure accounts
      Accounts.config({
          sendVerificationEmail: true,
          forbidClientAccountCreation: false
      });

    });
}
