class WidgetManager {
  constructor() {
    this.widget = null;
    this.isVisible = false;
    this.isMinimized = false;
    this.init();
  }

  async init() {
    await this.loadWidgetHTML();
    this.setupMessageListener();
  }
  
  async loadWidgetHTML() {
    try {
      const widgetURL = chrome.runtime.getURL('widget.html');
      const response = await fetch(widgetURL);
      const html = await response.text();
      
      this.widget = $(html);
      this.initializeWidget();
      
      $('body').prepend(this.widget);
      this.hideWidget();
      
      var editor = ace.edit("result");
      editor.setTheme("ace/theme/monokai");
      editor.session.setMode("ace/mode/c_cpp"); 
      
      editor.setOptions({
        fontSize: "12px" 
      });
      
      document.getElementById("copy-btn").addEventListener("click", function (e) {
        navigator.clipboard.writeText(ace.edit("result").getValue());
      });
      
      const widgetThis = this;

      document.getElementById("add-var").addEventListener("click", function (e) {
        let li = document.createElement("li");

        const typeSelector = widgetThis.createTypeSelector();
        typeSelector.classList.add("type");
        typeSelector.style.width = ((typeSelector.value.length + 2) * 8) + 'px';
        
        li.classList.add("sortable-item");
        li.innerHTML = `cin >> <input type="text" class="name input" value="n"> : ${typeSelector.outerHTML}<div style="float: right;"><button class="remove-btn">×</button></div>`;
        
        const inputIt = li.querySelectorAll('.input');
        inputIt.forEach(it => {
          it.addEventListener("input", function (e) {
            this.style.width = ((this.value.length + 1) * 8) + 'px';
          });
          it.style.width = ((it.value.length + 1) * 8) + 'px';
        });
        
        document.getElementById("sortable-list").appendChild(li);
        
        widgetThis.generateCode();
        
        li.querySelector(".remove-btn").addEventListener("click", function(e) {
          this.parentNode.parentNode.remove();
          widgetThis.generateCode();
        });
      });
      
      document.getElementById("add-container").addEventListener("click", function (e) {    
        let li = document.createElement("li");
        
        const span = document.createElement("span");

        const containerSelector = widgetThis.createContainerSelector();
        containerSelector.classList.add("vec-type");
        containerSelector.style.width = ((containerSelector.value.length + 2) * 8) + 'px';
        
        span.innerHTML += containerSelector.outerHTML;

        const typeSelector = widgetThis.createTypeSelector();
        typeSelector.classList.add("first");
        span.innerHTML += typeSelector.outerHTML + ", ";
        typeSelector.classList.remove("first");
        typeSelector.classList.add("second");
        typeSelector.hidden = true;
        span.innerHTML += typeSelector.outerHTML + "> ";

        li.classList.add("sortable-item");
        li.innerHTML = span.outerHTML + `<input type="text" class="con-name input" value="a">(<input type="text" class="con-size-var input" value="n">)<div style="float: right;"><button class="remove-btn" onclick="this.parentNode.parentNode.remove();">×</button></div>`;
        
        const inputIt = li.querySelectorAll('.input');
        inputIt.forEach(it => {
          it.addEventListener("input", function (e) {
            this.style.width = ((this.value.length + 1) * 8) + 'px';
          });
          it.style.width = ((it.value.length + 1) * 8) + 'px';
        });

        document.getElementById("sortable-list").appendChild(li);

        widgetThis.generateCode();

        li.querySelector(".remove-btn").addEventListener("click", function(e) {
          this.parentNode.parentNode.remove();
          widgetThis.generateCode();
        });
      });

      document.getElementById("use-abbr").addEventListener("change", function (e) {
        const change = document.querySelectorAll(".changeType");
        change.forEach(option => {
          if (document.getElementById("use-abbr").checked) {
            if (option.value == "long long") option.value = "ll";
            else option.value = "ull";
          } else {
            if (option.value == "ll") option.value = "long long";
            else option.value = "unsigned long long";
          }
        });

        widgetThis.generateCode();
      });

      document.getElementById("input-queue").addEventListener("input", function(e) {
        if (e.target.classList.contains("typeselect")) {
          e.target.style.width = ((e.target.value.length + 2) * 8) + 'px';
          widgetThis.generateCode();
        } else if (e.target.classList.contains("containerselect")) {
          e.target.style.width = ((e.target.value.length + 2) * 8) + 'px';
          widgetThis.generateCode();
          if (e.target.value == "vector<pair<") e.target.parentNode.querySelector(".second").hidden = false;
          else e.target.parentNode.querySelector(".second").hidden = true;
        } else {
          widgetThis.generateCode();
        }
      }, true);

      document.getElementById("settings").addEventListener("change", () => this.generateCode(), true);
      document.getElementById("use-t--").addEventListener("change", () => this.generateCode());
    } catch (error) {
      console.error('Error loading widget HTML:', error);
    }
  }
  
  generateTypes() {
    let avaibleTypes = ["int", "unsigned", "char", "string", "float", "double"];

    if (document.getElementById("use-abbr").checked) {
      avaibleTypes.push("ll");
      avaibleTypes.push("ull");
    } else {
      avaibleTypes.push("long long");
      avaibleTypes.push("unsigned long long");
    }

    return avaibleTypes;
  }

  
  createTypeSelector() {
    let avaibleTypes = this.generateTypes();
    
    const selector = document.createElement("select");
    selector.classList.add("typeselect");
    avaibleTypes.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      if (type === "ll" || type === "long long") {
        option.innerText = "ll";
        option.classList.add("changeType");
      } else if (type === "ull" || type === "unsigned long long") {
        option.innerText = "ull";
        option.classList.add("changeType");
      } else {
        option.innerText = type;
      }
      selector.appendChild(option);
    }); 
    
    return selector;
  }
  
  generateContainers() {
    let avaibleContainers = ["vector<", "vector<pair<", "set<"];
    return avaibleContainers;
  }

  createContainerSelector() {
    let avaibleContainers = this.generateContainers();

    const selector = document.createElement("select");
    selector.classList.add("containerselect");

    avaibleContainers.forEach(container => {
      const option = document.createElement("option");
      option.classList.add(container);

      option.innerText = container;

      selector.appendChild(option);
    });

    return selector;
  }

  generateCode() {
    const editor = ace.edit("result");

    let text = `#include <bits/stdc++.h>\nusing namespace std;\n\n`;

    // Add abbreviations if checked
    if (document.getElementById("use-abbr").checked) {
      text += `typedef long long ll;\ntypedef unsigned long long ull;\n\n`;
    }
    
    text += `int main() {\n`;
    
    // Add optimization options if checked
    if (document.getElementById("use-optz").checked) {
      text += `\tios::sync_with_stdio(0);\n\tcin.tie(0);\n\tcout.tie(0);\n`;
    }
    
    // Loop through input fields and add variable declarations
    var tabLevel = `\t`;
    
    if (document.getElementById("use-t--").checked) {
      if (document.getElementById("use-abbr").checked) {
        text += tabLevel + `ull t; cin >> t;\n`;
      } else {
        text += tabLevel + `unsigned long long t; cin >> t;\n`;
      }
      text += tabLevel + `while(t--) {\n`;
      tabLevel = `\t\t`;
    }
    
    var variables = new Map(), inputQ = [], fl = 0;

    const inputItems = document.querySelectorAll("#input-queue .sortable-item");
    inputItems.forEach(item => {
      const nameInput = item.querySelector(".name");
      const typeInput = item.querySelector(".type");

      const conName = item.querySelector(".con-name");
      const conType = item.querySelector(".containerselect");
      const conSize = item.querySelector(".con-size-var");
      
      if (nameInput && typeInput) {
        fl = 1;
        if (!variables.has(typeInput.value)) variables.set(typeInput.value, []);
        variables.get(typeInput.value).push(nameInput.value);
        inputQ.push(nameInput.value);
        // text += tabLevel + `${typeInput.value} ${nameInput.value}; cin >> ${nameInput.value}; \n`;
      } else if (conName && conType && conSize) {
        if (fl && inputQ.length > 0) {
          variables.forEach((names, type, map) => {
            text += tabLevel + type + ' ' + names[0];
            for (let i = 1; i < names.length; ++i) text += `, ` + names[i];
            text += `;\n`;
          });

          text += tabLevel + `cin`;
          inputQ.forEach(el => {
            text += ` >> ` + el;
          });
          text += `;\n`;

          inputQ.length = 0;
          variables = new Map();
        }
        fl = 0;

        if (conType.value.includes("pair")) {
          text += tabLevel + `${conType.value}${item.querySelector(".first").value}, ${item.querySelector(".second").value}>> ${conName.value}(${conSize.value});\n`;
          text += tabLevel + `for(auto& i : ${conName.value}) cin >> i.first >> i.second;\n`;
        } else if (conType.value.includes("set")) {
          text += tabLevel + item.querySelector(".first").value + ` TEMP;\n`;
          text += tabLevel + `${conType.value}${item.querySelector(".first").value}> ${conName.value};\n`;
          text += tabLevel + `for(long long i = 0; i < ${conSize.value}; ++i) {\n${tabLevel}\tcin >> TEMP;\n${tabLevel}\t${conName.value}.insert(TEMP);\n${tabLevel}}\n`;
        } else if (conType.value.includes("vector")) {
          text += tabLevel + `${conType.value}${item.querySelector(".first").value}> ${conName.value}(${conSize.value});\n`;
          text += tabLevel + `for(auto& i : ${conName.value}) cin >> i;\n`;
        }
      }
    });
    if (fl && inputQ.length > 0) {
      variables.forEach((names, type, map) => {
        text += tabLevel + type + ' ' + names[0];
        for (let i = 1; i < names.length; ++i) text += `, ` + names[i];
        text += `;\n`;
      });

      text += tabLevel + `cin`;
      inputQ.forEach(el => {
        text += ` >> ` + el;
      });
      text += `;\n`;

      inputQ.length = 0;
      variables = new Map();
    }
    fl = 0;
  
    if (document.getElementById("use-t--").checked) {
      text += `\t}\n`
    }

    // End of main function
    text += `}\n`;

    // Display the generated code in the editor
    editor.setValue(text);
    editor.getSelection().clearSelection();
  }

initializeWidget() {
  if (!this.widget) return;
  
  this.widget.css({
    position: 'fixed',
    top: '20px',
    left: '20px',
    width: '52em',
    height: '610px',
    zIndex: '10000'
  });

  // Инициализируем draggable
    this.setupDraggable();
    this.setupControls();

    // Sortable список
    $('#sortable-list', this.widget).sortable({
      placeholder: 'sortable-placeholder',
      opacity: 0.7,
      update: () => this.generateCode()
    });
  }

  setupDraggable() {
    this.widget.draggable({
      handle: '.widget-header',
      containment: 'window',
      cancel: '.widget-controls button'
    });
  }

  setupControls() {
    const $widget = this.widget;

    // Minimize button
    const minimizeBtn = $widget.find('.minimize-btn')[0];
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMinimize();
    });

    // Close button
    const closeBtn = $widget.find('.close-btn')[0];
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideWidget();
    });
  }

  toggleMinimize() {
    if (!this.widget) return;
    
    const content = this.widget.find('.widget-content')[0];
    const minimizeBtn = this.widget.find('.minimize-btn')[0];
    
    if (this.isMinimized) {
      // Разворачиваем - показываем контент
      content.style.display = 'block';
      this.widget.css('height', '600px');
      this.widget.css('width', '52em');
      minimizeBtn.textContent = '−';
      this.isMinimized = false;
      
    } else {
      // Сворачиваем - скрываем контент
      content.style.display = 'none';
      this.widget.css('height', '40px'); // Высота только заголовка
      this.widget.css('width', '20em');
      minimizeBtn.textContent = '+';
      this.isMinimized = true;
    }
  }

  showWidget() {
    if (!this.widget) return;

    ace.edit("result").setValue(`
        _.,,,.._ .
    ,d$$$$$$$SIIi:. .
  ,S$$$$$$$$$$SSIiIi:. .
  JI$$$$$$$$$$$SSIISSi:. .
  ,S$$$$$$$$$$$$SSIIs$Ii: .
  jª?$$$$$$$$$$$SSIISS$$Ii .
   : ?$$$$$$$$$SS7IISS$$I: .
  j_ /$$7'ª4$$$S7:iIS$$$$I' .
   ª?"?$$: '$k :iIIS$$s7' .
    | ?$L, ,d$ '·¨j$$7' .
  ,d._J$$$$S$$$L,_·'$$ .
  ?$$$$$$k:?$$ªº, ·' .
   \\:'ºªªº^':jIS7 .
  j$k,i;/_,oSSI' .
  ?SSS$$$$$?º' .
  'ªªªº"'' .
      `);
    ace.edit("result").getSelection().clearSelection();
    
    this.widget.show();
    this.isVisible = true;
    
    // Сбрасываем состояние при открытии - всегда развернутый вид
    const content = this.widget.find('.widget-content')[0];
    const minimizeBtn = this.widget.find('.minimize-btn')[0];
    content.style.display = 'block';
    this.widget.css('height', '600px');
    
    minimizeBtn.textContent = '−';
    this.isMinimized = false;
  }

  hideWidget() {
    if (this.widget) {
      this.widget.hide();
      this.isVisible = false;
      this.isMinimized = false;
    }
  }

  toggleWidget() {
    if (this.isVisible) {
      this.hideWidget();
    } else {
      this.showWidget();
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "toggleWidget") {
        this.toggleWidget();
        sendResponse({success: true, isVisible: this.isVisible});
        return true;
      }
    });
  }
}

// Инициализация
$(document).ready(() => {
  window.widgetManager = new WidgetManager();
});