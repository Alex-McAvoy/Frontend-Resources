const { resolve } = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const EslintWebpackPlugin = require("eslint-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");


//设置NodeJS环境变量，默认是生产环境
//process.env.NODE_ENV = "development";

const commonCssLoader = [ //复用loader
    MiniCssExtractPlugin.loader, //取代style-loader，提取js中的css成单独文件
    "css-loader", //将css文件整合到js中
    { //css兼容性处理
        /** 需要在package.json中配置browserslist
          * "browserslist": {
          *    "development": [
          *        "last 1 chrome version",
          *        "last 1 firefox version",
          *        "last 1 safari version"
          *   ],
          *   "production": [
          *       ">0.1%",
          *       "not dead",
          *       "not op_mini all"
          *   ]
          * }
          */
        "loader": "postcss-loader",
        "options": {
            "postcssOptions": {
                "plugins": [
                    "postcss-preset-env"
                ]
            }
        }
    }
];

module.exports = {
    "entry": { //多入口：有几个入口输出几个bundle
        "main1": resolve(__dirname, "src/entry1.js"),
        "main2": resolve(__dirname, "src/entry2.js")
    },
    "output": { //输出
        "filename": "js/[name].[contenthash:10].min.js", //输出文件名
        "path": resolve(__dirname, "build") //输出路径
    },
    "module": { //loader
        "rules": [{
            "oneOf": [ //以下loader只会匹配一次，应注意不能有两个loader处理同一类型的文件
                { //匹配css文件
                    "test": /\.css$/,
                    "use": [...commonCssLoader]
                }, { //匹配less文件

                    "test": /\.less$/,
                    "use": [...commonCssLoader, "less-loader"]
                }, { //匹配图片资源
                    "test": /\.(png|jpg|jpeg|gif|svg)$/,
                    "type": "asset", //内置asset模块代替原来的url-loader
                    "parser": {
                        /** 图片大小小于8kb，就会被base64处理
                         * 优点：减少请求数量，减缓服务器压力
                         * 缺点：图片体积会更大，文件请求速度变慢
                         */
                        "dataUrlCondition": {
                            "maxSize": 8 * 1024
                        }
                    },
                    "generator": { //命名格式
                        "filename": "img/[name].[hash:6].[ext]"
                    }
                }, { //处理字体资源
                    "test": /\.(ttf|eot|woff2)$/,
                    "type": "asset/resource", //内置asset模块代替原来的file-loader
                    "generator": {
                        "filename": "font/[name].[hash:6].[ext]"
                    }
                }, { //js兼容性处理
                    "test": /\.m?js$/,
                    "use": {
                        "loader": "babel-loader",
                        "options": {
                            "presets": ["@babel/preset-env"],
                            "plugins": ["@babel/plugin-transform-runtime"],
                            /** 利用babel开启文件资源缓存
                             *  1. 方式：在打包后的js、css文件输出名中，加上hash值，以防止文件改动后仍从缓存中读取
                             *  2. 三种解决方案
                             *  - [hash]：每次webpack构建时会生成一个唯一的hash，可能会导致所有缓存失效
                             *  - [chunkhash]：根据chunk生成hash，若打包来源同一chunk则hash值相同，
                             *                 由于css是被js引入的，两者同属一个chunk，hash相同
                             *  - [contenthash]： 根据文件内容生成hash
                             */
                            "cacheDirectory": true
                        }
                    },
                    "exclude": /node_modules/
                }, { //匹配ts文件
                    "test": /\.ts$/,
                    "use": [
                        "ts-loader" //将ts文件转为js文件
                    ],
                    "exclude": /node_modules/
                }
            ]
        }]
    },
    "plugins": [ //插件
        new HtmlWebpackPlugin({ //复制html文件，并自动引入打包输出后的所有资源
            "template": resolve(__dirname, "src/index.html")
        }),
        new MiniCssExtractPlugin({ //将js中的css拆分为文件
            "filename": "css/built.[contenthash:10].min.css" //对输出的css文件进行重命名
        }),
        new CssMinimizerPlugin(), //压缩css
        new EslintWebpackPlugin({ //Eslint
            "extensions": "js", //检查的文件类型
            "exclude": "/node_modules/", //排除第三方库
            "fix": true //开启自动修复
        }),
        new CleanWebpackPlugin() //每次构建都会先清除上次构建文件
    ],
    /** 代码分割
     * 1. 将js中使用的node_modules中代码单独打包成一个chunk输出
     * 2. 自动分析多入口文件中是否有公共依赖，若有，则提取出来
     */
    "optimization": {
        "splitChunks": {
            "chunks": "all"
        }
    },
    /** 生产模式
     * 1. 自动压缩js、html
     * 2. ES6 模块下自动启动Tree shaking，即去重无用代码
     *  - 可在package.json 设置 sideEffects: false，
     *    即所有代码都没有副作用，均可进行Tree shaking
     *  - 问题：可能会把 css、jpg 等文件去除
     *  - 解决：设置 sideEffects: ["*.css"]，则不会对css文件进行处理
     */
    "mode": "production",
    "devtool": "hidden-source-map", //source-map
    "externals": { //忽略的包，需要在src的html中，引入
        "jquery": "jQuery"
    }
};
