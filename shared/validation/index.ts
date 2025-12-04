type Rule = (value: any) => true | string;

export function validate(value: any) {
  const rules: Rule[] = [];

  return {
    required(message = "این فیلد الزامی است") {
      rules.push((v) =>
        v === null || v === undefined || v === "" ? message : true
      );
      return this;
    },

    min(min: number, message = `حداقل ${min} کاراکتر`) {
      rules.push((v) => (String(v).length < min ? message : true));
      return this;
    },

    max(max: number, message = `حداکثر ${max} کاراکتر`) {
      rules.push((v) => (String(v).length > max ? message : true));
      return this;
    },

    equal(length: number, message = `مقدار وارد شده باید ${length} رقم باشد`) {
      rules.push((v) => (String(v).length != length ? message : true));
      return this;
    },

    email(message = "ایمیل معتبر نیست") {
      const regex = /\S+@\S+\.\S+/;
      rules.push((v) => (!regex.test(String(v)) ? message : true));
      return this;
    },

    phone(message = "شماره تلفن معتبر نیست") {
      const regex = /^(09|98)\d{9}$/;
      rules.push((v) => {
        if (!v) return true;
        return !regex.test(String(v)) ? message : true;
      });
      return this;
    },

    checkRule(allowed: string | string[], message = "نقش نامعتبر است") {
      rules.push((v) => {
        if (!v) return true;
        if (typeof allowed === "string") {
          return v === allowed ? true : message;
        } else if (Array.isArray(allowed)) {
          return allowed.includes(v) ? true : message;
        }
        return message;
      });
      return this;
    },

    password(
      messageMin = "پسورد باید حداقل ۶ کاراکتر باشد",
      messageMax = "پسورد باید حداکثر ۵۰ کاراکتر باشد"
    ) {
      rules.push((v) => {
        const str = String(v);
        if (str.length < 6) return messageMin;
        if (str.length > 50) return messageMax;
        return true;
      });
      return this;
    },

    run() {
      for (const rule of rules) {
        const result = rule(value);
        if (result !== true) return result;
      }
      return true;
    },
  };
}
