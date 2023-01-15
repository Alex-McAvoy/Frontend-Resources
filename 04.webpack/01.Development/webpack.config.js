/* 
	npx webpack-dev-server
*/
const { resolve } = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin")

//设置NodeJS环境变量，默认是生产环境
// process.env.NODE_ENV = "development";

module.exports = {
	entry: resolve(__dirname, "src/entry.js"), //入口
	output: { //输出
		filename: "js/main.js", //输出文件名
		path: resolve(__dirname, "build") //输出路径
	},
	module: { //loader
		rules: [{
			oneOf: [ //以下loader只会匹配一次，应注意不能有两个loader处理同一类型的文件
				{ //匹配css文件 
					test: /\.css$/,
					use: [
						"style-loader", //创建style标签，将js中的样式资源插入html中
						"css-loader" //将css文件变为commonjs模块加载到js中，内容为样式字符串
					]
				}, { //匹配less文件		
					test: /\.less$/,
					use: [
						"style-loader",
						"css-loader",
						"less-loader" //将less文件转为css文件
					]
				}, { //匹配图片资源		
					test: /\.(png|jpg|jpeg|gif|svg)$/,
					type: "asset", //内置asset模块代替原来的url-loader
					parser: {
						/** 图片大小小于8kb，就会被base64处理
						 * 优点：减少请求数量，减缓服务器压力
						 * 缺点：图片体积会更大，文件请求速度变慢
						 */
						dataUrlCondition: {
							maxSize: 8 * 1024
						}
					},
					generator: { //命名格式
						filename: "img/[name].[hash:6].[ext]"
					}
				}, { //匹配字体资源
					test: /\.(ttf|eot|woff2)$/,
					type: "asset/resource", //内置asset模块代替原来的file-loader
					generator: {
						filename: "font/[name].[hash:6].[ext]"
					}
				},{ //匹配ts文件
					test: /\.ts$/,
					use: [
						"ts-loader" //将ts文件转为js文件
					],
					exclude: /node_modules/
				}
			]
		}]
	},
	plugins: [ //插件	
		new HtmlWebpackPlugin({ //复制html文件，并自动引入打包输出后的所有资源
			template: resolve(__dirname, "src/index.html")
		})
	],
	mode: "development", //开发模式
	/** 开发服务器
	 * - 作用：自动编译、自动打开浏览器、自动刷新浏览器
	 * - 特点：只会在内存中编译打包，不会有任何输出
	 * - 启动指令：npx webpack-dev-server
	 */
	devServer: {
		static: resolve(__dirname, 'build'), //构建后路径
		port: 3000,
		compress: true, //启动gzip压缩
		open: true, //自动打开浏览器
		/** 热部署 HMR
		 * 1. css的HMR功能由css-loader内部实现
		 * 2. js与html默认不使用HMR功能
		 *  - html不需要使用
		 *  - js需要添加支持HMR功能的代码
		 */
		hot: true
	},
	/** source-map：提供源代码到构建后代码的映射技术
	 * 1. 作用：当构建后的代码运行时出错，可通过映射追踪到源代码
	 * 2. 参数：[inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map
	 *  - source-map：外部，错误代码准确信息、源代码错误位置
	 *  - inline-source-map：内联，错误代码准确信息、源代码错误位置，只生成一个内联source-map，速度比外部快
	 *  - eval-source-map：内联，错误代码准确信息、源代码错误位置，每个文件都生成一个source-map
	 *  - hidden-source-map：外部，错误代码错误原因，构建后代码的错误位置，能够隐藏源代码信息，外部生成映射文件，速度比内联慢
	 *  - nosources-source-map：外部，错误代码准确信息，能够隐藏源代码和构建后代码信息
	 *	 - cheap-source-map：外部，错误代码准确信息、源码的错误位置，只精确到行
	 *	 - cheap-module-source-map：外部，错误代码准确信息、源码的错误位置，只精确到行，会将loader的source-map加入
	 * 3. 速度对比：eval > inline > cheap
	 * 4. 调试友好对比：source-map > cheap-module-source-map > cheap-source-map
	 * 5. 内联：代码体积变大，生产环境不考虑
	 * 6. 代码隐藏：hidden 只隐藏源代码、nosources 隐藏所有代码
	 * 7. 环境使用
	 *	 - 开发环境：速度快，调试更友好，一般选用 eval-source-map 或 eval-cheap-module-source-map
	 *	 - 生产环境：速度快，考虑源代码是否需要隐藏，一般选用 hidden-source-map 或 nosources-source-map
	 */
	devtool: "source-map"
}
