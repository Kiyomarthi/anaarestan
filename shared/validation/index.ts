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
      rules.push((v) => {
        if (!v) return true;
        return String(v).length < min ? message : true;
      });
      return this;
    },

    max(max: number, message = `حداکثر ${max} کاراکتر`) {
      rules.push((v) => {
        if (!v) return true;
        return String(v).length > max ? message : true;
      });
      return this;
    },

    equal(length: number, message = `مقدار وارد شده باید ${length} رقم باشد`) {
      rules.push((v) => {
        if (!v) return true;
        return String(v).length != length ? message : true;
      });
      return this;
    },

    email(message = "ایمیل معتبر نیست") {
      const regex = /\S+@\S+\.\S+/;
      rules.push((v) => {
        if (!v) return true;
        return !regex.test(String(v)) ? message : true;
      });
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

    checkRule(
      allowed: string | string[] | number[],
      message = "نقش نامعتبر است"
    ) {
      rules.push((v) => {
        if (!v) return true;
        if (typeof allowed === "string") {
          return v === allowed ? true : message;
        } else if (Array.isArray(allowed)) {
          return (allowed as (string | number)[]).includes(v) ? true : message;
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
        if (!v) return true;
        const str = String(v);
        if (str.length < 6) return messageMin;
        if (str.length > 50) return messageMax;
        return true;
      });
      return this;
    },
    slug(
      message = "اسلاگ معتبر نیست. فقط حروف فارسی و انگلیسی، عدد و خط تیره مجاز است"
    ) {
      const regex =
        /^[a-zA-Z0-9\u0600-\u06FF]+(?:-[a-zA-Z0-9\u0600-\u06FF]+)*$/;
      rules.push((v) => {
        if (!v) return true;
        const str = String(v).trim();
        return regex.test(str) ? true : message;
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
