const path = require("path");

module.exports = {
    //entry: [ 'babel-polyfill'],// './src/main'],
    module: {
        loaders: [
            {
                loader: "babel-loader",
                exclude: [
                    path.resolve(__dirname, "node_modules")
                ],
                query: {
                    plugins: ['transform-runtime'],
                    presets: ['es2015']
                }
            }
        ]
    }

};