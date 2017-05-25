const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const OfflinePlugin = require('offline-plugin');

const config = {
	context: __dirname + '/app',
  entry: {
  	main: './js/main.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  devServer: {
    compress: true,
    contentBase: __dirname + '/app'
  },
  
  module: {
    loaders: [
      {
        test: /\.js$/, //Check for all JS files
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: { presets: ['es2015'] }
        }]
      },
      {
        test: /\.css$/,
        loader:  ExtractTextPlugin.extract({
          loader: 'css-loader?importLoaders=1',
        }),
      },
      {
        test: /.*\.(gif|png|jpe?g|svg)$/i,
        loaders: [
          'file-loader',
          {
            loader: 'image-webpack',
            query: {
              progressive: true,
              optimizationLevel: 7,
              interlaced: false,
              pngquant: {
                quality: '65-90',
                speed: 4
              }
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'NODE_ENV': process.env.NODE_ENV
    }),
    new ExtractTextPlugin({
      filename: 'bundle.css',
      allChunks: true,
    }),
    new HtmlWebpackPlugin({
      template: __dirname + '/app/index.html',
      filename: __dirname + '/dist/index.html',
      minify: { collapseWhitespace: true }
    })
  ],
  devtool: 'eval-source-map'
}

// Setting plugins for production
if (process.env.NODE_ENV === 'production') {
  config.devtool = '';
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  );
  config.plugins.push(
    new OfflinePlugin({
      relativePaths: false,
      AppCache: false,
      publicPath: '/',
      excludes: ['*.txt', '*.svg', 'CNAME', '**/.DS_Store', 'images/*.*', 'images/touch/*.*', 'images/touch/*.*', '**/*.map'],
      externals: ['/index.html?utm_source=homescreen', 'images/touch/favicon.ico', 'images/touch/favicon-16x16.png', 'images/touch/favicon-32x32.png', 'images/touch/apple-touch-icon.jpg', 'images/touch/android-chrome-512x512.png', 'images/touch/android-chrome-192x192.png', '/decoder.min.js']
    })
  );
  config.plugins.push(
    new CopyWebpackPlugin([
      {
        from: {
          glob:  __dirname + '/app/images/**/*',
          dot: true
        },
        to: __dirname + '/dist'
      },
      { from: __dirname + '/app/decoder.min.js', to:  __dirname + '/dist/' },
      { from: __dirname + '/app/manifest.json', to:  __dirname + '/dist/' },
      { from: __dirname + '/CNAME', to:  __dirname + '/dist/' },
      { from: __dirname + '/robots.txt', to:  __dirname + '/dist/' }
    ])
  );
  config.plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: true
    })
  );
}

module.exports = config;
