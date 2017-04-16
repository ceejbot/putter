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
CSS_INPUTS := $(wildcard $(LESSDIR)/*.less)
CSS := $(addprefix $(CSSDIR)/,putter.css)

# javascript setup
BANKAIOPTS := --optimize --uglify=false
LIBDIR := assets/js
JSDIR := public/js/
JS_INPUTS := $(wildcard $(LIBDIR)/*.js)
JS := $(addprefix $(JSDIR),bundle.js)

LIBRARIES := node_modules/bootstrap/dist/js/bootstrap.js
LIBS_MIN = $(LIBRARIES:.js=.min.js)

all: css js

css: $(CSS)

$(CSS) : $(CSS_INPUTS)

$(CSSDIR)/%.css : $(LESSDIR)/%.less
	@echo Compiling $<
	@$(LESS) $(LESSOPTS) $< > $@

js: $(JS)

$(JS): $(JS_INPUTS)
	@echo Bankai $<
	@$(BANKAI) build $(BANKAIOPTS) $^ $(JSDIR)
	@mv $(JSDIR)/*.css $(CSSDIR)
	@mv $(JSDIR)/*.html $(JSDIR)/../

%.min.js: %.js
	@echo Minifying $<
	@$(UGLIFY) --no-mangle -nc $< > $@

$(JSDIR)libraries.js: $(LIBRARIES)
	@echo Concatenating third-party libraries
	@cat $^ | sed 's/^M//' >> $@

$(JSDIR)libraries.min.js: $(LIBS_MIN)
	@echo Concatenating minified libraries
	@cat $^ >> $@

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

clean:
	-rm $(CSS)
	-rm $(JS_TARGETS)

.PHONY: count provision cleardb inject js
