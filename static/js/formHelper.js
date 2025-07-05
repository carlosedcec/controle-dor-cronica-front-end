class FormHelper {

    constructor() {
        this.formObj = {};
        this.formInvalid = false;
    };

    processForm(formItens) {

        this.formObj = {};
        this.formInvalid = false;

        for (let formItem of formItens) {

            if (formItem.type !== "self") {
                document.getElementById(formItem.id).classList.remove("invalid");
            }

            if (formItem.required && (formItem.type !== "self" && !document.getElementById(formItem.id).value) || (formItem.type === "self" && !formItem.value)) {
                this.formInvalid = `O campo "${formItem.label}" é obrigatório`;
                if (formItem.type !== "self") {
                    document.getElementById(formItem.id).classList.add("invalid");
                }
                break;
            }

            let value = this.processFormItem(formItem);
            
            if (this.formInvalid) {
                break;
            }

            this.formObj[formItem.key] = value;
        };

    };

    processFormItem(formItem) {
        let value;
        if (formItem.type === "date") {
            value = this.validateDate(formItem);
        } else if (formItem.type === "time") {
            value = this.validateTime(formItem);
        } else if (formItem.type === "float") {
            value = this.validateFloat(formItem);
        } else if (formItem.type === "self") {
            value = formItem.value;
        } else {
            value = document.getElementById(formItem.id).value;
        }
        return value;
    };

    validateDate(formItem) {

        let value = document.getElementById(formItem.id).value;

        let dateReg = new RegExp(/^\d{2}[/]\d{2}[/]\d{4}$/);
        if (!dateReg.test(value)) {
            this.formInvalid = `O campo "${formItem.label}" está num formato inválido`;
            document.getElementById(formItem.id).classList.add("invalid");
            return null;
        }

        value = value.split("/")[2] + "-" + value.split("/")[1] + "-" + value.split("/")[0];

        let dateTest = new Date(value + "T00:00-03:00");
        if (Object.prototype.toString.call(dateTest) !== "[object Date]" || isNaN(dateTest)) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            document.getElementById(formItem.id).classList.add("invalid");
            return null;
        }

        return value;

    };

    validateTime(formItem) {

        let value = document.getElementById(formItem.id).value;

        let timeReg = new RegExp(/^\d{2}[:]\d{2}$/);
        if (!timeReg.test(value)) {
            this.formInvalid = `O campo "${formItem.label}" está num formato inválido`;
            document.getElementById(formItem.id).classList.add("invalid");
            return null;
        }

        let timeTest = new Date("2000-01-01T" + value + "-03:00");
        if (Object.prototype.toString.call(timeTest) !== "[object Date]" || isNaN(timeTest)) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            document.getElementById(formItem.id).classList.add("invalid");
            return null;
        }

        return value;

    };

    validateFloat(formItem) {

        let value = parseFloat(document.getElementById(formItem.id).value);

        if (isNaN(value)) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            document.getElementById(formItem.id).classList.add("invalid");
            return null;
        }

        if (formItem.min !== undefined && !isNaN(formItem.min) && value < formItem.min) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            document.getElementById(formItem.id).classList.add("invalid");
            return null;
        }

        if (formItem.max !== undefined && !isNaN(formItem.max) && value > formItem.max) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            document.getElementById(formItem.id).classList.add("invalid");
            return null;
        }

        return value;

    };

    getFormObject() {
        return this.formObj;
    };

    getValidationError() {
        return this.formInvalid;
    };

    isValid() {
        return !this.formInvalid;
    };

};