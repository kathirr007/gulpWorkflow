//Gulp configurations
var gulp = require('gulp'),
	gutil = require('gulp-util'),
	newer = require('gulp-newer'),
	del = require('del'),
	imagemin = require('gulp-imagemin'),
	pngcrush = require('imagemin-pngcrush'),
	imacss = require('gulp-imacss'),
	preprocess = require('gulp-preprocess'),
	htmlclean = require('gulp-minify-html'),
	size = require('gulp-size'),
	gulpif = require('gulp-if'),
	sass = require('gulp-sass'),
	pleeease = require('gulp-pleeease'),
	jshint = require('gulp-jshint'),
	deporder = require('gulp-deporder'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	stripDebug = require('gulp-strip-debug'),
	browsersync = require('browser-sync'),
	pkg = require('./package.json');


//file locations
var 
	devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production'),

	source = 'source/',
	dest = 'build/',

	images = {
		in: source + 'images/*.*',
		out: dest + 'images/' },

	imguri = {
		in: source + 'images/inline/*',
		out: source + 'scss/images/',
		filename: '_datauri.scss',
		nameSpace: 'img'
	}
	
	html = {
		in: source + '*.html',
		watch: [source + '*.html', 'templage/**/*'],
		out: dest,
		context: {
			devBuild: devBuild,
			author: pkg.author,
			version: pkg.version }
		},

	css = {
		in: source + 'sass/main.scss',
		watch: [source + 'sass/**/*' + '!' + source + imguri.out + imguri.filename],
		out: dest + 'css',
		sassOpts: {
			outputStyle: 'nested',
			precision: 5,
			errorLogToConsole: true },
		pleeeaseOpts: {
			autoprefixer: { browsers: ['last 2 versions', '> 2%']},
			pseudoElements: true,
			mqpacker: true,
			minifier: !devBuild}
		},

	fonts = {
		in : source + 'fonts/*.*',
		out : dest + 'css/fonts/'
	},

	js = {
		in: source + 'js/**/*',
		out: dest + 'js/',
		filename: 'main.js'
	},

	syncOpts = {
		server: {
			baseDir: dest,
			index: 'index.html'
		},
		open: false,
		notify: true
	};

//output build type
console.log(pkg.name + ' ' + pkg.version + ' ' + (devBuild ? 'development' : 'production') + ' build.')

//clean the build folder
gulp.task('clean', function(){
	del([
			dest + '*'
		]);
});	

//manage images
gulp.task('images', function(){
	    gulp.src(images.in)
		.pipe(newer(images.out))
		.pipe(imagemin())
		.pipe(gulp.dest(images.out));
});

//convert inline images to dataURIs in SCSS source
gulp.task('imguri', function(){
	gulp.src(imguri.in)
	.pipe(imagemin())
	.pipe(imacss(imguri.filename, imguri.nameSpace))
	.pipe(gulp.dest(imguri.out));
});

//manage html sources
gulp.task('html', function(){
	var pages = gulp.src(html.in).pipe(preprocess({ context: html.context }))
		if(!devBuild){
			pages = pages
				.pipe(size({ title: 'HTML in' }))
				.pipe(htmlclean())
				.pipe(size({ title: 'HTML out' }))
			}
		return pages.pipe(gulp.dest(html.out));
});	

//copy fonts
gulp.task ('fonts', function(){
	return gulp.src(fonts.in)
		.pipe(newer(fonts.out))
		.pipe(gulp.dest(fonts.out))
});

//compile sass
gulp.task('css', ['imguri'], function() {
		gulp.src(source + 'sass/main.scss')
		.pipe(sass(css.sassOpts))
		.pipe(size({title: 'CSS in '}))
		.pipe(pleeease(css.pleeeaseOpts))
		.pipe(size({title: 'CSS out '}))
		.pipe(gulp.dest(css.out))
		.pipe(browsersync.reload({ stream: true }));
});
gulp.task('js', function() {
		if(devBuild){
			gulp.src(js.in)
		.pipe(newer(js.out))
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'))
		.pipe(gulp.dest(js.out))
	} else {
		del([
				dest + 'js/*'
			]);
		gulp.src(js.in)
		.pipe(deporder())
		.pipe(concat(js.filename))
		.pipe(size({title: 'Js in '}))
		.pipe(stripDebug())
		.pipe(uglify())
		.pipe(size({title: 'Js out '}))
		.pipe(gulp.dest(js.out))
	}
		
		// .pipe(browsersync.reload({ stream: true }));
});

//browsersync

gulp.task('browsersync', function(){
	browsersync(syncOpts);
});

//default task
gulp.task('default', ['html', 'images', 'fonts', 'css', 'js', 'browsersync'], function(){
	gulp.watch(images.in, ['images']);
	gulp.watch(html.watch, ['html', browsersync.reload]);
	gulp.watch(fonts.in, ['fonts']);
	gulp.watch([css.watch, imguri.in] , ['css']);
	gulp.watch([js.in] , ['js', browsersync.reload]);

});