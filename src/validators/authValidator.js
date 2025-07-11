const valid = require('validator');
const validateSignUp = ({
  firstName,
  lastName,
  password,
  emailId,
  confirmPassword,
}) => {
  if (!password || !firstName || !lastName || !emailId || !confirmPassword)
    throw new Error('Invalid Request some fields are missing');
  if (password.length < 5 || password.length > 100)
    throw new Error('password length between 5 to 100 characters only');
  if (password !== confirmPassword)
    throw new Error('Confirm password and Actual password not matching');
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{5,}$/;
  if (!passwordRegex.test(password))
    throw new Error(
      'Password must contain minimum 1 uppercase, 1 lowercase, 1 special character and a number and length > 4'
    );
  if (!valid.isEmail(emailId)) throw new Error('Invalid Email Address');
  if (firstName.length < 3 || firstName.length > 50)
    throw new Error('firstName length must be btw 3 to 50 characters');
  if (lastName.length < 3 || lastName.length > 50)
    throw new Error('lastName length must be btw 3 to 50 characters');
  const firstNameAlphabetic = /^[A-Za-z]+$/.test(firstName);
  const lastNameAlphabetic = /^[A-Za-z]+$/.test(lastName);
  if (!firstNameAlphabetic || !lastNameAlphabetic)
    throw new Error('firstName and lastName can contain alphabets only');
};

const validateLogin = ({ emailId, password }) => {
  if (!password || !emailId) throw new Error('password or emailId is missing');
  if (password.length < 5 || password.length > 100)
    throw new Error('password length between 5 to 100 characters only');
  if (!valid.isEmail(emailId)) throw new Error('Invalid Email Address');
};

module.exports = { validateSignUp, validateLogin };
