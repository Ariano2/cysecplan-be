const productValidator = ({ name, stock, category, price }) => {
  if (!name || !stock || !price || !category)
    throw new Error('Product Fields are missing');
  if (name.length < 3 || name.length > 100)
    throw new Error('Name length is between 3 to 100 characters');
  if (price < 1 || price > 10000000)
    throw new Error('Price in range 1-10000000');
  const validCategories = ['insurance', 'book', 'course'];
  if (!validCategories.includes(category)) throw new Error('Invalid category');
  if (stock < 0 || stock > 100000) throw new Error('stock in range 0-100000');
};
module.exports = { productValidator };
