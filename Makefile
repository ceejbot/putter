DATE=$(shell date)
BANNER= // Putter Assets Build $(DATE)

# use locally-installed tools
NPM_BIN := node_modules/.bin/
LESS := $(addprefix $(NPM_BIN), lessc)
LOGGER := $(addprefix $(NPM_BIN), bistre)
BROWSERIFY := $(addprefix $(NPM_BIN), browserify)
BANKAI := $(addprefix $(NPM_BIN), bankai)

# CSS setup
LESSOPTS :=
LESSDIR := assets/css
CSSDIR := public/css
CSS := $(addprefix $(CSSDIR)/,putter.css)

# javascript libraries setup
LIBDIR := assets/js
LIBRARIES := node_modules/bootstrap/dist/js/bootstrap.js
LIBS_MIN = $(LIBRARIES:.js=.min.js)

JSDIR := public/js/
JS_TARGETS := $(addprefix $(JSDIR), bootstrap.js)

all: css js

css: $(CSS)

$(CSSDIR)/%.css : $(LESSDIR)/%.less
	@echo Compiling $<
	@$(LESS) $(LESSOPTS) $< > $@

js: $(JS_TARGETS)

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

$(JSDIR)putter.js: $(APPJS)
	@echo Browserifying $@
	$(BROWSERIFY) $^ -o $@

$(JSDIR)putter-debug.js: $(APPJS)
	$(BROWSERIFY) --debug $^ -o $@

directories:
	@-mkdir $(CSSDIR) $(JSDIR) log

count:
	@cloc . --exclude-dir=node_modules,pages/public,assets,components --exclude-lang=HTML,CSS,YAML

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

.PHONY: count provision cleardb run inject
