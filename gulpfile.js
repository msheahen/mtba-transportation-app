var gulp = require('gulp');
var gutil = require('gulp-util');

/* Let's preprocess our scss into css files!  */

var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var scss = require('postcss-scss');
var autoprefixer = require('autoprefixer');

var postcssProcessors = [
	autoprefixer( {
		browsers: 'last 2 versions'
	} )
];

var sassMainFile = 'src/styles/main.scss';
var sassFiles = 'src/styles/**/*.scss';

gulp.task('css', function() {
	gulp.src(sassMainFile)
		// PostCSS
		.pipe(
			postcss(postcssProcessors, {syntax: scss})
		)
		// SASS to CSS
		.pipe(
			sass({ outputStyle: 'compressed' })
			.on('error', gutil.log)
		)
		.pipe(gulp.dest('dist/assets/css'));
});

/* Yay, now let's uglify our javascript! */
var uglify = require('gulp-uglify');
var jsFiles = 'src/scripts/**/*.js';

var jsMainFiles = 'src/scripts/main/*.js';
var jsSWFile = 'src/scripts/sw/service-worker.js';


gulp.task('js', function() {
	gulp.src(jsMainFiles)
		.pipe(uglify())
		.pipe(gulp.dest('dist/assets/js'));
	gulp.src(jsSWFile)
		.pipe(uglify())
		.pipe(gulp.dest('dist/'));
});




/*
Sweet, now we need to move our html files into dist and
process our handlebars templates into the right format as well!
*/

var fileinclude = require('gulp-file-include');

gulp.task('fileinclude', function() {
  gulp.src(['src/views/index.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('dist/'));
});


/*
serve it up!
*/
var browserSync = require('browser-sync');
gulp.task('connectWithBrowserSync', function() {
	browserSync.create();
	browserSync.init({
		server: './dist'
	});
});

/*
watch for changes in our code to we can auto-reload
*/
gulp.task('watch', function() {
	gulp.watch(sassFiles,['css']).on('change', browserSync.reload);
	gulp.watch(jsFiles,['js']).on('change', browserSync.reload);
	gulp.watch(['src/views/*.html'], ['fileinclude']).on('change', browserSync.reload);
});



/*
 gulp serve will get our page up and running!
 */
gulp.task('serve', ['connectWithBrowserSync', 'css', 'js', 'fileinclude', 'watch']);
