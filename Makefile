# use locally-installed tools
export PATH := ./node_modules/.bin/:$(PATH)

# CSS setup
LESSOPTS :=
LESSDIR := assets/css
CSSDIR := public/css
CSS_INPUTS := $(wildcard $(LESSDIR)/*.less)
VENDOR_CSS := $(addprefix node_modules/,tachyons/css/tachyons.min.css tachyons-buttons/tachyons-buttons.min.css)
CSS := $(addprefix $(CSSDIR)/,putter.css) $(addprefix $(CSSDIR)/,$(notdir $(VENDOR_CSS)))

# javascript setup
BANKAIOPTS := --optimize --uglify=false
LIBDIR := assets/js
JSDIR := public/js/
JS_INPUTS := $(wildcard $(LIBDIR)/*.js)
JS := $(addprefix $(JSDIR),bundle.js)

LIBRARIES := node_modules/bootstrap/dist/js/bootstrap.js
LIBS_MIN = $(LIBRARIES:.js=.min.js)

all: css js

fooble:
	@echo $(CSS)

css: $(CSS)

$(CSSDIR)/%.css : $(LESSDIR)/%.less
	@echo Compiling $<
	@lessc $(LESSOPTS) $< > $@

$(CSSDIR)/%.min.css : node_modules/*/%.min.css
	@echo Copying $<
	@cp $< $@

js: $(JS)

$(JS): $(JS_INPUTS)
	@echo Bankai $<
	@bankai build $(BANKAIOPTS) $^ $(JSDIR)
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
	browserify --debug $^ -o $@

directories:
	@-mkdir $(CSSDIR) $(JSDIR) log

count:
	@cloc . --exclude-dir=node_modules,pages/public,assets,components --exclude-lang=HTML,CSS,YAML

provision:
	@echo Creating development db and running migrations...
	#@ DB_NAME=putter_dev npm run db:create
	@npm run db:up

cleardb:
	./provision/cleardb.js | bistre

inject:
	cd test && ./inject-data.js

clean:
	-rm $(CSS)
	-rm $(JS_TARGETS)

.PHONY: count provision cleardb inject js
