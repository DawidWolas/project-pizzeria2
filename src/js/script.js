/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product{
    constructor(id ,data){
      const thisProduct=this;
      thisProduct.id =id;
      thisProduct.data= data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      // console.log('new Product',thisProduct);
    }
    renderInMenu(){
      const thisProduct =this;
      /* generate Html based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /*create element using utils.createElementsFromHTML*/
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /*find menu container*/
      const menuContainer = document.querySelector(select.containerOf.menu);
      
      /*add element to menu*/
      menuContainer.appendChild(thisProduct.element);

    } 

    getElements(){
      const thisProduct = this;
    
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion(){
      const thisProduct = this;

     
      const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

      
      clickableTrigger.addEventListener('click', function(event) {
      
        event.preventDefault();
        
        const activeProduct =document.querySelector(select.all.menuProductsActive);
        
        if (activeProduct != null && thisProduct.activeProduct != null) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });

    }
    initOrderForm(){
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
      // console.log('initOrderForm', thisProduct);
    }
    processOrder(){
      const thisProduct = this;
      // console.log('processOrder',thisProduct);
      const formData =utils.serializeFormToObject(thisProduct.form);
      // console.log('formData',formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        console.log(paramId, param);
    

        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          // console.log(optionId, option);
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          
          // check if there is param with a name of paramId in formData and if it includes optionId
          if(optionSelected) {
          
            if(!option.default == true){
            
              price += option.price;
               
           
            } 
          }else{ 
               
            if(option.default){
              // check if the option is default
     
              // reduce price variable
              price -= option.price;
            } 
          }
          
          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);

          // check if there is an image
          if(optionImage){

            // check if the option is selected
            if(optionSelected){

              // if yes add class active (image)
              optionImage.classList.add(classNames.menuProduct.imageVisible);

              // if not remove class active (image)
            } else  {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
    
             
        }
        // update calculated price in the HTML
        

       
      } 
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
       
    }
    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }
    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProduct(){
      const thisProduct = this;

      const productSummary ={};
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = productSummary.priceSingle * productSummary.amount;
      productSummary.params = thisProduct.prepareCartProductParams();
      return productSummary;
    }
    prepareCartProductParams(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {}
        };
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          if(optionSelected) {
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
  }  

  
  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
      // console.log('AmountWidget' ,thisWidget);
      // console.log('constructor arguments:' ,element);
    }
    getElements(element){
      const thisWidget = this;
    
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      
    }

    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);

      /*TODO :Add validation*/
      if(thisWidget.value !== newValue&& !isNaN(newValue)&& settings.amountWidget.defaultMin -1 <= newValue  && newValue <= settings.amountWidget.defaultMax +1) {
      
        thisWidget.value = newValue;
        thisWidget.announce();
      
      }
      
      thisWidget.input.value = thisWidget.value;
    }
      
    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value -1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value +1);
      });
    }
    announce(){
      const thisWidget = this;

      const event = new CustomEvent('updated',{
        bubbles: true
      }); 
        
      
      thisWidget.element.dispatchEvent(event);
    }
  }
  class Cart{
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
      // console.log('new Cart',thisCart);
    }
    getElements(element){
      const thisCart =this;

      thisCart.dom ={};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address );  
      
      
        
     
    }
    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated',function(){
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function(event){
        
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit',function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }
    add(menuProduct){
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();
      // console.log('thisCart.product', thisCart.products);
      // console.log('adding product',menuProduct);
    }
    update(){
      const thisCart = this;
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for (let cartProduct of thisCart.products){
        thisCart.totalNumber = thisCart.totalNumber + cartProduct.amount;
        thisCart.subtotalPrice = thisCart.subtotalPrice + cartProduct.price;
      }
      if (thisCart.totalNumber == 0){
        thisCart.totalPrice = 0;  
      } else {
        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      }
      for(let totalPriceCart of thisCart.dom.totalPrice){
        totalPriceCart.innerHTML = thisCart.totalPrice;
      }
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;  
    }
    remove(cartProduct){
      const thisCart = this;
      const indexOfThings = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(indexOfThings, 1);
      cartProduct.dom.wrapper.remove();
      thisCart.update();
    }
    sendOrder() {
      const thisCart = this;
      const url = settings.db.url + "/" + settings.db.orders;
      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice - thisCart.deliveryFee,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };
      console.log( 'payload' , payload);
      for (let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      fetch(url, options);
    }
  }
  
  class CartProduct{
    constructor(menuProduct,element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element); 
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
      console.log(menuProduct);
    }
    getElements(element){
      const thisCartProduct =this;
      thisCartProduct.dom = {} ;
      thisCartProduct.dom.wrapper= element ;
      thisCartProduct.dom.amountWidget = element.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);
      // console.log('thisCartProduct', thisCartProduct);
    }
    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;

        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amountWidget.value;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }
    remove(){
      const thisCartProduct =this;
      const event = new CustomEvent('remove',{
        bubbles:true,
        detail: {
          cartProduct:thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
      console.log('remove',this.remove);
    }
    initActions(){
      const thisCartProduct =this;
      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    getData() {
      const thisCartProduct = this;
      const order = [];
      order.id = thisCartProduct.id;
      order.amount = thisCartProduct.amountWidget.value;
      order.priceSingle = thisCartProduct.priceSingle;
      // order.name = thisCartProduct.name;
      order.params = thisCartProduct.params;
      order.price = thisCartProduct.price;
      return order;
    }
  }
  const app = {
    initData: function(){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse',parsedResponse);

          /*save prasedResponse as thisApp.data.product*/
          thisApp.data.products = parsedResponse;
          /*execute initMenu method*/
          thisApp.initMenu();
        });
      console.log('thisApp.data',JSON.stringify(thisApp.data));
    },
    initMenu:function(){
      const thisApp =this;
      // console.log('thisApp.data' , thisApp.data);
      
      for (let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
        
      }
      
    },
    init: function(){
      const thisApp = this;
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);
      thisApp.initData();
      thisApp.initCart();
    },
    initCart:function(){
      const thisApp = this;

      const cartElem =document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
  };
  
  app.init();
  
}

