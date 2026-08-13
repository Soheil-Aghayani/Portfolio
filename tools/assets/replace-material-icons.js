const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..', '..');
const iconMap = {
    check_circle: 'states/check-circle',
    open_in_new: 'states/external-link-rounded',
    public: 'ui/globe',
    eco: 'ui/leaf',
    bar_chart: 'ui/bar-chart-rounded',
    code: 'ui/python',
    science: 'ui/ecology-science-erlenmeyer-flask-experiment-lab-flask-science-chemistry-solution',
    translate: 'ui/language',
    schedule: 'ui/schedule',
    search: 'ui/search'
};

for (const relative of ['index.html', 'projects.html', 'css/os.css']) {
    const file = path.join(repo, relative);
    let source = fs.readFileSync(file, 'utf8');

    source = source.replace(
        /<span\s+class="material-symbols-rounded([^"]*)"([^>]*)>([a-z0-9_]+)<\/span>/gi,
        (match, extraClasses, attributes, name) => {
            const icon = iconMap[name.toLowerCase()];
            if (!icon) return match;
            return `<span class="svg-icon-slot${extraClasses}" data-icon="${icon}"${attributes}></span>`;
        }
    );
    source = source.replace(/\.material-symbols-rounded/g, '.svg-icon');
    fs.writeFileSync(file, source, 'utf8');
}

console.log('Replaced Material Symbol markup and selectors with local icon slots.');
