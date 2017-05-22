# use locally-installed tools
export PATH := ./node_modules/.bin/:$(PATH)

# CSS setup
LESSDIR := assets/css
CSSDIR := public/css
CSS_INPUTS := $(wildcard $(LESSDIR)/*.less)
CSS := $(addprefix $(CSSDIR)/,putter.css)

# templates for front-end app
TEMPLATEDIR := templates/shared
HTMLDIR := assets/html
PUGFILES := $(wildcard $(TEMPLATEDIR)/*.pug)
HTML := $(patsubst $(TEMPLATEDIR)/%.pug,$(HTMLDIR)/%.html,$(PUGFILES))

# javascript setup
BANKAIOPTS := --optimize --uglify=false
LIBDIR := assets/js
JSDIR := public/js
JS_INPUTS := $(wildcard $(LIBDIR)/*.js)
JS := $(addprefix $(JSDIR)/,$(notdir $(JS_INPUTS)))

LIBRARIES := node_modules/bootstrap/dist/js/bootstrap.js
LIBS_MIN = $(LIBRARIES:.js=.min.js)

all: css js html

foozle:
	@echo $(JS)
	@echo $(JS_INPUTS)

css: $(CSS)

$(CSSDIR)/%.css : $(LESSDIR)/%.less
	@echo Compiling $<
	@tachyons $< > $@ --minify

html: $(HTML)

$(HTMLDIR)/%.html: $(TEMPLATEDIR)/%.pug
	@echo compiling $<
	@pug --pretty < $< > $@

js: $(JS)

$(JS): $(JS_INPUTS)

$(JSDIR)/%.js: $(LIBDIR)/%.js
	@echo bundling $<
	@bankai build $(BANKAIOPTS) $<
	@rm dist/index.html
	@mv dist/bundle.css $(CSSDIR)/$*.css
	@mv dist/bundle.js $(JSDIR)/$*.js

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

provision:
	@echo Creating development db and running migrations...
	@ DB_NAME=putter_dev npm run db:create
	@npm run db:up

migrate-up:
	@npm run db:up

migrate-down:
	@npm run db:down

clean:
	-rm $(CSS)
	-rm $(JS_TARGETS)

.PHONY: provision migrate-up migrate-down js css html fooble
