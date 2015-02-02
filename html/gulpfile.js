var gulp        = require('gulp'),
	minifyCss   = require('gulp-minify-css'),
	livereload  = require('gulp-livereload'),
	gulpif      = require('gulp-if'),
	args        = require('yargs').argv,
	del         = require('del'),
   sass        = require('gulp-ruby-sass'),
	sourcemaps = require('gulp-sourcemaps');

var isProduction = args.prod;

var paths = {
	styles : './ui/scss/app.scss'
	//scripts: './components/b-page/js/*.js',
	//images : ['./components/**/*.png', './components/**/*.jpg'],
	//fonts  : ['./components/b-page/fonts/**/*']
};

gulp.task('styles', function (cb) {
	return sass(paths.styles, { sourcemap: true })
	.on('error', function (err) {
		console.error('Error', err.message);
	})
	.pipe(sourcemaps.write('maps', {
		includeContent: false,
		sourceRoot: paths.styles
	}))
	.pipe(gulpif(isProduction, minifyCss({keepBreaks: true})))
	.pipe(gulp.dest('./ui/css/neodice'))
});

// Clean
gulp.task('clean', function (cb) {
	del(['./ui/neodice/app.css'], cb);
});

// Watch
gulp.task('watch', function () {
	livereload.listen();
	gulp.watch('./ui/scss/**/*.scss', ['styles']).on('change', updateLivereload);
	function updateLivereload() {
		setTimeout(livereload.changed, 0);
	}
});

// Default task
gulp.task('default', ['styles', 'watch']);
