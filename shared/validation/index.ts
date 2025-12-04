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
      // شماره ایران: 11 رقم، شروع 09 یا 98
      const regex = /^(09|98)\d{9}$/;
      rules.push((v) => (!regex.test(String(v)) ? message : true));
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
