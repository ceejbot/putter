DATE=$(shell date)
BANNER= // Sparky Assets Build $(DATE)

# use locally-installed tools
NPM_BIN := node_modules/.bin/
LINT := $(addprefix $(NPM_BIN), jshint)
UGLIFY := $(addprefix $(NPM_BIN), uglifyjs)
LESS := $(addprefix $(NPM_BIN), recess)
MOCHA := $(addprefix $(NPM_BIN), mocha)
LOGGER := $(addprefix $(NPM_BIN), bistre)
BROWSERIFY := $(addprefix $(NPM_BIN), browserify)
SUPERVISOR := $(addprefix $(NPM_BIN), supervisor)

# CSS setup
LESSOPTS := --compile
LESSDIR := assets/css
CSSDIR := pages/public/css
CSS := $(addprefix $(CSSDIR)/,light.css dark.css sparky.css)

# javascript libraries setup
APPJS = assets/js/app.js
LIBDIR := assets/libs
BOOTSTRAP = $(addprefix components/bootstrap/js/, bootstrap-transition.js bootstrap-alert.js bootstrap-button.js bootstrap-carousel.js bootstrap-collapse.js bootstrap-dropdown.js bootstrap-modal.js bootstrap-tooltip.js bootstrap-popover.js bootstrap-scrollspy.js bootstrap-tab.js bootstrap-typeahead.js bootstrap-affix.js)
COMPONENTS := $(addprefix components/, jquery/jquery.js bootstrap/bootstrap.js)
LIBRARIES := $(COMPONENTS) $(LIBDIR)/davis.js
LIBS_MIN = $(LIBRARIES:.js=.min.js)


JSDIR := pages/public/js/
JS_TARGETS := $(addprefix $(JSDIR), libraries.js libraries.min.js sparky.js sparky.min.js sparky-debug.js)

all: css js

css: $(CSS)

$(CSSDIR)/%.css : $(LESSDIR)/%.less
	@echo Compiling $<
	@$(LESS) $(LESSOPTS) $< > $@

js: $(JS_TARGETS)

components/bootstrap/bootstrap.js: $(BOOTSTRAP)
	@echo Concatenating bootstrap javascript
	@cat $^ > components/bootstrap/bootstrap.js

%.min.js: %.js
	@echo Minifying $<
	@$(UGLIFY) --no-mangle -nc $< > $@

$(JSDIR)libraries.js: $(LIBRARIES)
	@echo Concatenating third-party libraries
	@echo $(BANNER) > $@
	@cat $^ | sed 's/^M//' >> $@

$(JSDIR)libraries.min.js: $(LIBS_MIN)
	@echo Concatenating minified libraries
	@echo $(BANNER) > $@
	@cat $^ >> $@

$(JSDIR)sparky.js: $(APPJS)
	@echo Browserifying $@
	$(BROWSERIFY) $^ -o $@

$(JSDIR)sparky-debug.js: $(APPJS)
	$(BROWSERIFY) --debug $^ -o $@

watch:
	$(SUPERVISOR) --watch assets/js --no-restart-on exit --exec make js

directories:
	@-mkdir $(CSSDIR) $(JSDIR) log

count:
	@cloc . --exclude-dir=node_modules,pages/public,assets,components --exclude-lang=HTML,CSS,YAML

lint:
	$(LINT) lib test api-auth api-completer api-data bin

test:
	@$(MOCHA) -R spec test/test*.js

test-cov:
	$(MOCHA) --require blanket -R travis-cov test/test-*.js

coverage:
	$(MOCHA) --require blanket -R html-cov test/test-*.js > test/coverage.html

provision:
	./provision/provision.js | $(LOGGER)

cleardb:
	./provision/cleardb.js | $(LOGGER)

inject:
	cd test && ./inject-data.js

run:
	cd pages && node app.js | ../$(LOGGER)

clean:
	-rm $(CSS)
	-rm $(JS_TARGETS)

.PHONY: test test-cov coverage lint count provision cleardb run inject watch
