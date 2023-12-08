var TEMPLATE_TAGS = [{
        id: 1,
        name: 'RId',
        description: 'The unique ID for the recipient.'
    },
    {
        id: 2,
        name: 'Ad',
        description: 'Alıcının adı.'
    },
    {
        id: 3,
        name: 'Soyad',
        description: 'Alıcının soyadı.'
    },
    {
        id: 4,
        name: 'Vəzifə',
        description: 'Alıcının vəzifəsi .'
    },
    {
        id: 5,
        name: 'Kimdən',
        description: 'E-poçt-lar kimin adı ilə göndərilsin.'
    },
    {
        id: 6,
        name: 'TrackingURL',
        description: 'Açılan e-poçtları izləmək üçün URL.'
    },
    {
        id: 7,
        name: 'Tracker',
        description: 'Gizli izləmə şəkli əlavə edən HTML teqi (TrackingURL əvəzinə tövsiyə olunur).'
    },
    {
        id: 8,
        name: 'URL',
        description: 'Sənin Phishing səhifən.'
    },
    {
        id: 9,
        name: 'BaseURL',
        description: 'Əsas URL.'
    }
];

var textTestCallback = function (range) {
    if (!range.collapsed) {
        return null;
    }

    return CKEDITOR.plugins.textMatch.match(range, matchCallback);
}

var matchCallback = function (text, offset) {
    var pattern = /\{{2}\.?([A-z]|\})*$/,
        match = text.slice(0, offset)
        .match(pattern);

    if (!match) {
        return null;
    }

    return {
        start: match.index,
        end: offset
    };
}

/**
 * 
 * @param {regex} matchInfo - The matched text object
 * @param {function} callback - The callback to execute with the matched data
 */
var dataCallback = function (matchInfo, callback) {
    var data = TEMPLATE_TAGS.filter(function (item) {
        var itemName = '{{.' + item.name.toLowerCase() + '}}';
        return itemName.indexOf(matchInfo.query.toLowerCase()) == 0;
    });

    callback(data);
}

/**
 * 
 * @param {CKEditor} editor - The CKEditor instance.
 * 
 * Installs the autocomplete plugin to the CKEditor.
 */
var setupAutocomplete = function (editor) {
    editor.on('instanceReady', function (evt) {
        var itemTemplate = '<li data-id="{id}">' +
            '<div><strong class="item-title">{name}</strong></div>' +
            '<div><i>{description}</i></div>' +
            '</li>',
            outputTemplate = '[[.{name}]]';

        var autocomplete = new CKEDITOR.plugins.autocomplete(evt.editor, {
            textTestCallback: textTestCallback,
            dataCallback: dataCallback,
            itemTemplate: itemTemplate,
            outputTemplate: outputTemplate
        });

        // We have to use brackets for the output template tag and 
        // then manually replace them due to the way CKEditor's 
        // templating works.
        autocomplete.getHtmlToInsert = function (item) {
            var parsedTemplate = this.outputTemplate.output(item);
            parsedTemplate = parsedTemplate.replace("[[", "{{").replace("]]", "}}")
            return parsedTemplate
        }
    });
}