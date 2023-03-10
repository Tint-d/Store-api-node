const Product = require("../models/productModel");
const asyncHandler = require("express-async-handler");

const getAllStatic = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .sort("price")
    .select("name price company");

  res.status(200).json({ products, nbHits: products.length });
});

const getAllProducts = async (req, res) => {
  const { company, category, name, sort, fields, numericFilters } = req.query;
  const queryObject = {};

  if (company) {
    queryObject.company = company;
  }
  if (category) {
    queryObject.category = category;
  }
  if (name) {
    queryObject.name = { $regex: name, $options: "i" };
  }

  if (numericFilters) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g;
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );
    const options = ["price", "rating"];
    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-");
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) };
      }
    });
  }
  let result = Product.find(queryObject);
  // sort
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("createdAt");
  }

  //   fields
  if (fields) {
    const fieldsList = fields.split(",").join(" ");
    result = result.select(fieldsList);
  }

  const page = Number(req.query.page) || 1;
  const totalProducts = await Product.find(queryObject).count()
  const limit = Number(req.query.limit) || totalProducts;
  const skip = (page - 1) * limit;
  
  result = result.skip(skip).limit(limit);

  const products = await result;
  res.status(200).json({ products, nbHits: products.length });
};

module.exports = { getAllProducts, getAllStatic };
