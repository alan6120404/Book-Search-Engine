const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // get a user by username
        user: async (parent, { username }) => {
            return User.findOne({ username })
            .select('-__v -password')
            .populate('friends')
            .populate('thoughts');
        },
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
          
            return { token, user };
          },
          login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
          
            if (!user) {
              throw new AuthenticationError('Incorrect credentials');
            }
          
            const correctPw = await user.isCorrectPassword(password);
          
            if (!correctPw) {
              throw new AuthenticationError('Incorrect credentials');
            }
          
            const token = signToken(user);
            return { token, user };
          },
          saveBook: async (parent, args, context) => {
            if (context.user) {
              const book = await Book.create({ ...args, username: context.user.username });
          
              await Book.findByIdAndUpdate(
                { bookId: context.user.bookId },
                { $push: { bookId: book.bookId } },
                { new: true }
              );
          
              return Book;
            }
          
            throw new AuthenticationError('You need to be logged in!');
        },
    }
  };