fetch("results.json")
    .then(r => r.json())
    .then(data => {
        var used_by = {};
        data.forEach(s => {
            if (s.idl && s.idl.idlNames) {
                Object.keys(s.idl.idlNames).forEach(n => { if (!used_by[n]) used_by[n] = [];});
                Object.keys(s.idl.idlNames._dependencies).forEach( n => {
                    s.idl.idlNames._dependencies[n].forEach(d => {
                        if (!used_by[d]) {
                            used_by[d] = [];
                        }
                        used_by[d].push(n);
                    });
                });
            }
        });
        const body = document.querySelector("body");
        const params = location.search.slice(1);
        const paramName = params.split("=")[0] || null;
        const paramValue = params.split("=")[1] || null;
        switch(paramName) {
        case "idlname":
            body.appendChild(interfaceDetails(data, paramValue, used_by));
            break;
        case "enums":
            body.appendChild(enumNames(data, paramValue));
            break;
        case "full":
        default:
            body.appendChild(fullList(data, used_by, paramValue));
        }
    });

function fullList(data, used_by, sort) {

    const sortFn = sort === "popularity" ? ((a,b) => used_by[b].length - used_by[a].length) : defaultSort;

    const section = document.createElement("section");
    const p = document.createElement("p");
    var linkToGraph = document.createElement("a");
    linkToGraph.href = "graph-cyto.html";
    linkToGraph.textContent = "Graph of IDL inter-dependencies";
    p.appendChild(linkToGraph);
    section.appendChild(p);
    section.appendChild(sorterLink("full", sort));

    [{type:"interface", title: "Interfaces"}, {type: "dictionary", title:"Dictionaries"}, {type:"typedef", title:"Typedefs"}, {type:"enum", title: "Enums"}, {type:"callback", title: "Callbacks"}].forEach(
        type => {
            const h2 = document.createElement("h2");
            h2.textContent = type.title;

            section.appendChild(h2);
            const ol = document.createElement("ol");
            const names = data.filter(hasIdlDef)
                  .map(spec =>
                       Object.keys(spec.idl.idlNames)
                       .filter(n => n!=="_dependencies")
                       .filter(n => spec.idl.idlNames[n].type === type.type)
                      ).reduce((a,b) => a.concat(b), [])
                  .sort(sortFn);
            names.forEach(name => {
                const item = document.createElement("li");
                const link = document.createElement("a");
                link.href= "?idlname=" + name;
                link.textContent = name;
                item.appendChild(link);
                const annotation = document.createElement("span");
                const usage = used_by[name] ? used_by[name].length : 0;
                annotation.title = "used by " + usage + " other IDL items";
                annotation.textContent = " (" + usage + ")";
                item.appendChild(annotation);
                ol.appendChild(item);
            });
            section.appendChild(ol);
        });
    return section;
}

function interfaceDetails(data, name, used_by) {
    const section = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = name;
    section.appendChild(h2);

    const defHeading = document.createElement("h3");
    defHeading.textContent = "Definition";
    section.appendChild(defHeading);
    let type;
    data.filter(hasIdlDef)
        .filter(spec => spec.idl.idlNames[name])
        .forEach(spec => {
            const mainDef = document.createElement("p");
            const link = document.createElement("a");
            link.textContent = spec.title;
            link.href= spec.url;
            type = spec.idl.idlNames[name].type;
            mainDef.appendChild(link);
            mainDef.appendChild(document.createTextNode(" defines " + name));
            section.appendChild(mainDef);
        });

    const partialDef = document.createElement("p");
    partialDef.textContent = "This " + type + " is extended in the following specifications:";
    const partialDefList = document.createElement("ol");
    data.filter(hasIdlDef)
        .filter(spec => spec.idl.idlExtendedNames[name])
        .forEach(spec => {
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.href = spec.url;
            link.textContent = spec.title;
            item.appendChild(link);
            partialDefList.appendChild(item);
        });
    if (partialDefList.childNodes.length) {
        section.appendChild(partialDef);
        section.appendChild(partialDefList);
    }

    const usedByHeading = document.createElement("h3");
    usedByHeading.textContent = "Refering IDL interfaces/dictionaries";
    const usedByList = document.createElement("ol");
    (used_by[name] || []).forEach(n => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.textContent = n;
        link.href = "?idlname=" + n;
        item.appendChild(link);
        usedByList.appendChild(item);
    });
    if (usedByList.childNodes.length) {
        section.appendChild(usedByHeading);
        section.appendChild(usedByList);
    }

    const h3 = document.createElement("h3");
    h3.textContent = "Refering specifications";
    const ol = document.createElement("ol");
    data.filter(s => s.idl && s.idl.externalDependencies && s.idl.externalDependencies.indexOf(name) !== -1)
        .forEach(spec => {
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.textContent = spec.title + " refers to " + name + "";
            link.href= spec.url;
            item.appendChild(link);
            ol.appendChild(item);
        });
    if (ol.childNodes.length) {
        section.appendChild(h3);
        section.appendChild(ol);
    }
    return section;
}

function enumNames(data, sort) {
    const section = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = "Names used in enumerations";
    section.appendChild(h2);

    const sortFn = sort === "popularity" ? ((e1, e2) => e2.specs.length - e1.specs.length) : ((e1,e2) => -1);

    section.appendChild(sorterLink("enums", sort));

    const ol = document.createElement("ol");
    data.filter(hasIdlDef)
    const enumValues = data.filter(hasIdlDef)
          .map(spec =>
               Object.keys(spec.idl.idlNames)
               .filter(n => n!=="_dependencies")
               .filter(n => spec.idl.idlNames[n].type === "enum")
               .map(n => spec.idl.idlNames[n].values.map(v =>
                                                         {return {url: spec.url,title: spec.title, enumName: n, value: v};})
                    .reduce((a,b) => a.concat(b), [])))
          .reduce((a,b) => a.concat(b), [])
          .reduce((a,b) => a.concat(b), [])
          .sort(defaultSort);
    const uniqueNames = enumValues.map(e => e.value);
    const uniqueEnumValues = enumValues.filter((e, i) => i === uniqueNames.indexOf(e.value))
          .map(e => {
              const matchingEnums = enumValues.filter(f => f.value === e.value);
              return {value: e.value,
                      specs: matchingEnums.map(f => { return {enumName: f.enumName, title: f.title, url: f.url};})
                     };
          }).
          sort(sortFn);
    uniqueEnumValues.forEach(e => {
        const item = document.createElement("li");
        item.appendChild(document.createTextNode('"'+ e.value + '"'));
        const specList = document.createElement("ol");
        e.specs.forEach(s => {
            const spec = document.createElement("li");
            spec.appendChild(document.createTextNode(" used in enum " + s.enumName + " in "));
            const link = document.createElement("a");
            link.href=s.url;
            link.textContent = s.title;
            spec.appendChild(link)
            specList.appendChild(spec);
        });
        item.appendChild(specList);
        ol.appendChild(item);
    });
    section.appendChild(ol);
    return section;

}

function sorterLink(paramName, sort) {
    const sorter = document.createElement("a");
    sorter.href = "?" + paramName + "=" + (sort === "popularity" ? "" : "popularity");
    sorter.textContent = "Sort by " + (sort === "popularity" ? "name" : "popularity");
    return sorter;
}

var hasIdlDef = s => s.idl && s.idl.idlNames;
var defaultSort = (a,b) => a.value < b.value ? -1 : (a.value > b.value ? 1 : 0);
