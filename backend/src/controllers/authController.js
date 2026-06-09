// Kontroler autentykacji: rejestracja i logowanie użytkownika
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================================================
// Walidacja po stronie serwera 
// ============================================================================
const isValidEmail = (email) => {
  // Proste wyrażenie regularne do sprawdzania poprawności formatu email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  // Hasło musi mieć co najmniej 6 znaków
  return password && password.length >= 6;
};

/**
 * Rejestruje nowego użytkownika w MongoDB.
 * Hasło jest haszowane przy użyciu bcrypt przed zapisem.
 */
const register = async (req, res) => {
  try {
    const { email, password, preferences } = req.body;

    // Walidacja obecności danych
    if (!email || !password) {
      return res.status(400).json({ message: 'Email i hasło są wymagane' });
    }

    // Walidacja formatu danych po stronie serwera
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Niepoprawny format adresu email' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Hasło musi zawierać co najmniej 6 znaków' });
    }

    const istniejacyUzytkownik = await User.findOne({ email });
    if (istniejacyUzytkownik) {
      return res.status(400).json({ message: 'Użytkownik o podanym emailu już istnieje' });
    }

    const sol = await bcrypt.genSalt(10);
    const zahashowaneHaslo = await bcrypt.hash(password, sol);

    const nowyUzytkownik = new User({
      email,
      password: zahashowaneHaslo,
      preferences,
    });

    await nowyUzytkownik.save();

    const token = jwt.sign(
      { userId: nowyUzytkownik._id, email: nowyUzytkownik.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Użytkownik został utworzony pomyślnie',
      token,
      user: {
        id: nowyUzytkownik._id,
        email: nowyUzytkownik.email,
        preferences: nowyUzytkownik.preferences,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Wystąpił błąd podczas rejestracji użytkownika',
      error: error.message,
    });
  }
};

/**
 * Loguje użytkownika i zwraca token JWT po poprawnej weryfikacji hasła.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Walidacja obecności danych
    if (!email || !password) {
      return res.status(400).json({ message: 'Email i hasło są wymagane' });
    }

    // Walidacja formatu danych przed zapytaniem do bazy
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Niepoprawny format adresu email' });
    }

    const uzytkownik = await User.findOne({ email });
    if (!uzytkownik) {
      return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const poprawneHaslo = await bcrypt.compare(password, uzytkownik.password);
    if (!poprawneHaslo) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const token = jwt.sign(
      { userId: uzytkownik._id, email: uzytkownik.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Logowanie przebiegło pomyślnie',
      token,
      user: {
        id: uzytkownik._id,
        email: uzytkownik.email,
        preferences: uzytkownik.preferences,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Wystąpił błąd podczas logowania użytkownika',
      error: error.message,
    });
  }
};

/**
 * Usuwa użytkownika z MongoDB po identyfikatorze.
 */
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Nie znaleziono użytkownika w bazie.' });
    }

    return res.status(200).json({
      message: 'Użytkownik został pomyślnie usunięty z MongoDB.',
      deletedUserId: req.params.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Błąd serwera podczas usuwania.',
      error: error.message,
    });
  }
};

/**
 * Aktualizuje użytkownika w MongoDB po identyfikatorze.
 */
const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Nie znaleziono użytkownika w bazie.' });
    }

    return res.status(200).json({
      message: 'Hasło zostało zaktualizowane',
      updatedUserId: req.params.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Błąd serwera podczas aktualizacji.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  deleteUser,
  updateUser,
};