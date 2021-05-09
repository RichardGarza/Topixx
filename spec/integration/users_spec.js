const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/users/";
const User = require("../../src/db/models").User;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const Comment = require("../../src/db/models").Comment;
const Favorite = require("../../src/db/models").Favorite;
const sequelize = require("../../src/db/models/index").sequelize;

describe("routes : users", () => {

  beforeEach((done) => {

    sequelize.sync({force: true})
    .then(() => {
      done();
    })
    .catch((err) => {
      console.log(err);
      done();
    });

  });

  describe("GET /users/:id", () => {

    beforeEach((done) => {

      this.user;
      this.post;
      this.comment;

      User.create({
        email: "starman@tesla.com",
        password: "Trekkie4lyfe"
      })
      .then((user) => {
        this.user = user;

        Topic.create({
          title: "Winter Games",
          description: "Post your Winter Games stories.",
          posts: [{
            title: "Snowball Fighting",
            body: "So much snow!",
            userId: this.user.id
          }]
        }, {
          include: {
            model: Post,
            as: "posts"
          }
        })
        .then((topic) => {
          this.post = topic.posts[0];

          Comment.create({
            body: "This comment is alright.",
            postId: this.post.id,
            userId: this.user.id
          })
          .then((comment) => {
            this.comment = comment;
            Favorite.create({
              userId: this.user.id,
              postId: this.post.id
            }).then(() => { done(); })
          })
        })
      })
    });

    it("should present user's posts && user's comment && user's favorite posts", (done) => {
      User.create({
        email: "shaqalack@tallMen.com",
        password: "hanesTagless71"
      })
      .then((user) => {
        Post.create({
          title: "Fireball Fighting",
          body: "So much Pain!",
          userId: user.id,
          topicId: this.post.topicId
        })
        .then((post) => {
          Favorite.create({
            userId: this.user.id,
            postId: post.id
          })
          .then(
            setTimeout(() => {  // Give database 2 seconds to catch up before sending request.
              request.get(`${base}${this.user.id}`, (err, res, body) => {

                // Verify body contains user's post 
                expect(body).toContain("Snowball Fighting"); 

                // Verify body contains user's comment
                expect(body).toContain("This comment is alright.");

                // Verify body contains favorited post created by other user
                expect(body).toContain("Fireball Fighting");

                done();
              });
            }, 2000)
          )
        })
      })
      .catch((err) => { console.log(err); done(); })
    });
  });

  describe("GET /users/sign_up", () => {

    it("should render a view with a sign up form", (done) => {
      request.get(`${base}sign_up`, (err, res, body) => {
        expect(err).toBeNull();
        expect(body).toContain("Sign up");
        done();
      });
    });

  });

  describe("POST /users", () => {

    it("should create a new user with valid values and redirect", (done) => {
      
      const options = {
        url: base,
        form: {
          email: "user@example.com",
          password: "123456789"
        }
      }
      // Send Post Request
      request.post(options,
        (err, res, body) => {

      // Check Database for new User
          User.findOne({where: {email: "user@example.com"}})
          .then((user) => {
            expect(user).not.toBeNull();
            expect(user.email).toBe("user@example.com");
            expect(user.id).toBe(1);
            done();
          })
          .catch((err) => {
            console.log(err);
            done();
          });
        }
      );
    });

    it("should create a new admin with secret values and redirect", (done) => {
          
      const options = {
        url: base,
        form: {
          email: "admin@secretsaucyness.com",
          password: "123456789"
        }
      }
      // Send Post Request
      request.post(options,
        (err, res, body) => {

      // Check Database for new Admin User
          User.findOne({where: {email: "admin@secretsaucyness.com"}})
          .then((user) => {
            expect(user).not.toBeNull();
            expect(user.email).toBe("admin@secretsaucyness.com");
            expect(user.role).toBe("admin");
            expect(user.id).toBe(1);
            done();
          })
          .catch((err) => {
            console.log(err);
            done();
          });
        }
      );
    });
    
    it("should not create a new user with invalid attributes and redirect", (done) => {
      request.post(
        {
          url: base,
          form: {
            email: "no",
            password: "123456789"
          }
        },
        (err, res, body) => {
          User.findOne({where: {email: "no"}})
          .then((user) => {
            expect(user).toBeNull();
            done();
          })
          .catch((err) => {
            console.log(err);
            done();
          });
        }
      );
    });
  });

  describe("GET /users/sign_in", () => {

    it("should render a view with a sign in form", (done) => {
      request.get(`${base}sign_in`, (err, res, body) => {
        expect(err).toBeNull();
        expect(body).toContain("Sign in");
        done();
      });
    });
  });
});