// Model Mongoose dla użytkownika
// Zgodnie ze specyfikacją: pola: email, password, preferences
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const preferencesSchema = new mongoose.Schema({
  targetSqm: {
    type: Number,
    default: 50,
  },
  rooms: {
    type: Number,
    default: 2,
  },
  maxBudgetPLN: {
    type: Number,
    default: 700000,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Email użytkownika - wymagany i unikalny
  email: {
    type: String,
    required: [true, 'Email jest wymagany'],
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Zahashowane hasło
  password: {
    type: String,
    required: [true, 'Hasło jest wymagane'],
    minlength: [6, 'Hasło musi mieć co najmniej 6 znaków'],
  },

  // Preferencje użytkownika jako zagnieżdżony obiekt
  preferences: {
    type: preferencesSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
});

// Przed zapisaniem użytkownika: hashowanie hasła, jeśli jeszcze nie zostało zahashowane.
// Używamy wersji bez `next`, bo Mongoose zwraca tu Promise i callback nie jest potrzebny.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  if (typeof this.password === 'string' && this.password.startsWith('$2')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Metoda instancyjna do porównywania haseł
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    // W razie błędu porównania zwracamy false
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);
