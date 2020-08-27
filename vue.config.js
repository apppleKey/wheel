const webpack = require("webpack")
// const path = require("path")
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin')
const path = require('path')
const IS_PROD = ["production", "prod"].includes(process.env.NODE_ENV);

let objectProject = {
  index: {
    entry: 'src/PC/main.js', // page 的入口
    template: 'src/public/index.html', // 模板来源
    filename: 'index.html', // 在 dist/index.html 的输出
    // 当使用 title 选项时，template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
    title: 'JQTY直播',
    // 在这个页面中包含的块，默认情况下会包含,提取出来的通用 chunk 和 vendor chunk。
    chunks: ['chunk-vendors', 'chunk-common', 'index']
  },
  h5: {
    entry: 'src/H5/main.js',
    template: 'src/public/index.html',
    filename: 'H5.html',
    title: 'JQTY-h5',
    chunks: ['chunk-vendors', 'chunk-common', 'h5']
  }
}

let page = {}
let projectname = process.argv[3] || 'index' // 获取执行哪个文件
//   if (process.env.NODE_ENV == 'development') {
//     page = objectProject
//   } else {
//     page[projectname] = objectProject[projectname]
//   }

// 本地环境是否需要使用cdn
const devNeedCdn = false

// cdn链接
const cdn = {
  // cdn：模块名称和模块作用域命名（对应window里面挂载的变量名称）
  externals: {
    vue: 'Vue',
    vuex: 'Vuex',
    'vue-router': 'VueRouter',
    'axios': 'axios',
    'element-ui': 'ELEMENT',
    'dplayer': 'DPlayer',
    'flv.js': 'flvjs',
    'hls.js': 'Hls',
  },
  // cdn的css链接
  css: [
    // 'https://cdn.bootcss.com/nprogress/0.2.0/nprogress.min.css'
  ],
  // cdn的js链接
  js: [
    'https://cdn.bootcss.com/vue/2.6.11/vue.min.js',
    'https://cdn.bootcss.com/vuex/3.1.2/vuex.min.js',
    'https://cdn.bootcss.com/vue-router/3.1.5/vue-router.min.js',
    'https://cdn.bootcss.com/axios/0.19.2/axios.min.js',
    'https://cdn.bootcdn.net/ajax/libs/element-ui/2.13.1/index.js',
    'https://cdn.bootcdn.net/ajax/libs/dplayer/1.25.1/DPlayer.min.js',
    'https://cdn.bootcdn.net/ajax/libs/flv.js/1.5.0/flv.min.js',
    'https://cdn.bootcdn.net/ajax/libs/hls.js/0.13.2/hls.light.min.js'
  ]
}

module.exports = {
  publicPath: './', // 官方要求修改路径在这里做更改，默认是根目录下，可以自行配置
  // outputDir: 'dist'+projectname, //标识是打包哪个文件
  outputDir: '../dist', //标识是打包哪个文件
  filenameHashing: true, //hash结尾
  pages: objectProject,
  productionSourceMap: false, // 生产环境 sourceMap
  devServer: {
    open: true, // 项目构建成功之后，自动弹出页面
    host: '0.0.0.0', // 主机名，也可以127.0.0.0 || 做真机测试时候0.0.0.0
    port: 8080, // 端口号，默认8080
    https: false, // 协议
    hotOnly: false, // 没啥效果，热模块，webpack已经做好了
    proxy: {
      '/live-papi': {
        // 目标 API 地址
        // target: 'http://thomas.frieApi.net',
        target: 'https://a05-dev-web.we-pj.com',
        // target: 'https://a02-test-papi.we-pj.com',
        // target: 'https://a02-test-web.we-pj.com',
        // target: 'http://a02-test-www.we-pj.com/',
        // target:'https://dev-fire.lkch8.site',
        // target:'http://10.8.51.16:8080/',
        // 如果要代理 websockets
        ws: true,
        pathRewrite: {
          '^/live-papi': '/live-papi'
        },
        // 将主机标头的原点更改为目标URL
        changeOrigin: true
      },
    }
  },
  chainWebpack: config => {
    // 热更新修复
    config.resolve.symlinks(true);

    // ============注入cdn start============
    // html --> html-index
    config.plugin('html-index').tap(args => {

      // 生产环境或本地需要cdn时，才注入cdn
      if (IS_PROD || devNeedCdn) args[0].cdn = cdn
      return args
    })
    config.plugin('html-h5').tap(args => {

      // 生产环境或本地需要cdn时，才注入cdn
      if (IS_PROD || devNeedCdn) args[0].cdn = cdn
      return args
    })

    // 图片压缩
    if (IS_PROD) {
      config.module
        .rule("images")
        .use("image-webpack-loader")
        .loader("image-webpack-loader")
        .options({
          mozjpeg: {
            progressive: true,
            quality: 65
          },
          optipng: {
            enabled: false
          },
          pngquant: {
            quality: [0.65, 0.9],
            speed: 4
          },
          gifsicle: {
            interlaced: false
          }
          // webp: { quality: 75 }
        });
      // 打包分析
      config.plugin("webpack-report").use(BundleAnalyzerPlugin, [{
        analyzerMode: "static"
      }]);
    }
  },
  configureWebpack: config => {
    // 用cdn方式引入，则构建时要忽略相关资源
    if (IS_PROD || devNeedCdn) config.externals = cdn.externals
    config.plugins.push(
        // 开启gzip压缩
        new CompressionWebpackPlugin({
          algorithm: 'gzip',
          test: /\.js$|\.html$|\.json$|\.css/,
          threshold: 10240,
          minRatio: 0.8
        })
      ),
      config.optimization = {
        /**
         * 打包时刪除console.log
         * 请正确使用console提供的API
         * try catch内 || 必要时 建议使用 warning、error
         * **/
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
              },
            },
          }),
        ],
        // splitChunks: {
        //   cacheGroups: {
        //     vendor: {
        //       chunks: 'all',
        //       test: /node_modules/,
        //       name: 'vendor',
        //       minChunks: 1,
        //       maxInitialRequests: 5,
        //       minSize: 0,
        //       priority: 100
        //     },
        //     common: {
        //       chunks: 'all',
        //       test: /[\\/]src[\\/]js[\\/]/,
        //       name: 'common',
        //       minChunks: 2,
        //       maxInitialRequests: 5,
        //       minSize: 0,
        //       priority: 60
        //     },
        //     styles: {
        //       name: 'styles',
        //       test: /\.(sa|sc|c)ss$/,
        //       chunks: 'all',
        //       enforce: true
        //     },
        //     runtimeChunk: {
        //       name: 'manifest'
        //     }
        //   }
        // }
      },
      // 开启分离js
      // optimization: {
      //   runtimeChunk: 'single',
      //   splitChunks: {
      //     chunks: 'all',
      //     maxInitialRequests: Infinity,
      //     minSize: 20000,
      //     cacheGroups: {
      //       vendor: {
      //         test: /[\\/]node_modules[\\/]/,
      //         name(module) {
      //           // get the name. E.g. node_modules/packageName/not/this/part.js
      //           // or node_modules/packageName
      //           const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
      //           // npm package names are URL-safe, but some servers don't like @ symbols
      //           return `npm.${packageName.replace('@', '')}`
      //         }
      //       }
      //     }
      //   }
      // },
      // 取消webpack警告的性能提示
      config.performance = {
        hints: 'warning',
        //入口起点的最大体积
        maxEntrypointSize: 50000000,
        //生成文件的最大体积
        maxAssetSize: 30000000,
        //只给出 js 文件的性能提示
        assetFilter: function (assetFilename) {
          return assetFilename.endsWith('.js');
        }
      }
  },
  css: {
    loaderOptions: {
      less: {
        javascriptEnabled: true
      }
    },
    extract: true, // 是否使用css分离插件 ExtractTextPlugin
    sourceMap: false, // 开启 CSS source maps
    modules: false // 启用 CSS modules for all css / pre-processor files.
  },
  // 打包时不生成.map文件 map文件的作用在于：项目打包后，代码都是经过压缩加密的，如果运行时报错，输出的错误信息无法准确得知是哪里的代码报错。
  productionSourceMap: false,
  
}
