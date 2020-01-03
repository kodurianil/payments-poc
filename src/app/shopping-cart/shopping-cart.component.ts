import { environment } from './../../environments/environment';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CartService } from '../services/cart.service';
import { PaymentService } from '../payment.service';
import { Razorpay } from 'razorpay';
@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss']
})
export class ShoppingCartComponent implements OnInit {

  products: any[] = [];
  objectKeys = Object.keys;
  totalPrice = 0;
  quantity = 0;
  payableAmount = 0;
  WindowRef: any;
  processingPayment: boolean;
  paymentResponse: any = {};
  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private changeRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cartService.getCartItems()
      .subscribe(cartItems => {
        this.products = cartItems;
        this.calculatePrice();
      });
    this.WindowRef = this.paymentService.WindowRef;
  }

  getValue(object) {
    const key = this.objectKeys(object);
    return object[key.toString()];
  }

  increaseProductQuantity(product) {
    product.quantity++;
    this.quantity += 1;
    this.totalPrice += product.price;
  }

  decreaseProductQuantity(product) {
    product.quantity--;
    this.quantity -= 1;
    this.totalPrice -= product.price;
  }

  calculatePrice() {
    this.totalPrice = 0;
    this.quantity = 0;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.products.length; i++) {
      this.totalPrice += this.products[i].quantity * this.products[i].price;
      this.quantity += this.products[i].quantity;
    }
  }

  proceedToPay($event) {
    this.processingPayment = true;
    this.payableAmount = this.totalPrice * 1;
    this.initiatePaymentModal($event);
  }


  initiatePaymentModal(event) {

    const receiptNumber = `Receipt#${Math.floor(Math.random() * 5123 * 43) + 10}`;

    const orderDetails = {
      amount: this.payableAmount,
      receipt: receiptNumber
    };

    this.paymentService.createOrder(orderDetails)
      .subscribe(order => {
        console.log('TCL: CheckoutComponent -> initiatePaymentModal -> order', order);
        const rzp1 = new this.WindowRef.Razorpay(this.preparePaymentDetails(order));
        this.processingPayment = false;
        rzp1.open();
        event.preventDefault();
      }, error => {
        console.log('TCL: CheckoutComponent -> initiatePaymentModal -> error', error);
      });

  }


  preparePaymentDetails(order) {

    const ref = this;
    return {
      key: environment.RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
      // Amount is in currency subunits. Default currency is INR. Hence, 29935 refers to 29935 paise or INR 299.35.
      amount: this.payableAmount,
      name: 'Pay',
      currency: order.currency,
      order_id: order.id,
      // This is a sample Order ID. Create an Order using Orders API.
      // (https://razorpay.com/docs/payment-gateway/orders/integration/#step-1-create-an-order).
      // Refer the Checkout form table given below
      image: 'https://angular.io/assets/images/logos/angular/angular.png',
      handler: (response) => {
        ref.handlePayment(response);
      },
      prefill: {
        name: `Angular Geeks`
      },
      theme: {
        color: '#2874f0'
      }
    };
  }

  handlePayment(response) {

    this.paymentService.capturePayment({
      amount: this.payableAmount,
      payment_id: response.razorpay_payment_id
    })
      .subscribe(res => {
        this.paymentResponse = res;
        this.changeRef.detectChanges();
      },
        error => {
          this.paymentResponse = error;
        });
  }

  // payTheAmount() {
  //   // const options = {
  //   //   key: 'rzp_test_hcgbrXa7sFWann', // Enter the Key ID generated from the Dashboard
  //   //   amount: '100', // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise or INR 500.
  //   //   currency: 'INR',
  //   //   name: 'Acme Corp',
  //   //   description: 'A Wild Sheep Chase is the third novel by Japanese author  Haruki Murakami',
  //   //   image: 'https://example.com/your_logo',
  //   //   order_id: 'order_9A33XWu170gUtm',
  //   //   // This is a sample Order ID. Create an Order using Orders API. 
  //   //   // (https://razorpay.com/docs/payment-gateway/orders/integration/#step-1-create-an-order). 
  //   //   // Refer the Checkout form table given below
  //   //   handler: (response) => {
  //   //     alert(response.razorpay_payment_id);
  //   //   },
  //   //   prefill: {
  //   //     name: 'Gaurav Kumar',
  //   //     email: 'gaurav.kumar@example.com',
  //   //     contact: '9999999999'
  //   //   },
  //   //   notes: {
  //   //     address: 'note value'
  //   //   },
  //   //   theme: {
  //   //     color: '#F37254'
  //   //   }
  //   // };
  //   // console.log(this.WindowRef.Razorpay);
  //   const razorPay = new this.WindowRef.Razorpay({
  //     key_id: 'rzp_test_hcgbrXa7sFWann',
  //     key_secret: 'GE8GJeIrMNeLApFVVMQ4n8aL'
  //   });
  //   const createOrderOptions = {
  //     amount: 50000,  // amount in the smallest currency unit
  //     currency: 'INR',
  //     receipt: 'order_rcptid_11',
  //     payment_capture: '0'
  //   };
  //   // instance.orders.create(options, function(err, order) {
  //   //   console.log(order);
  //   // })
  //   // const rzp1 = new this.WindowRef.Razorpay(options);
  //   razorPay.orders.create(createOrderOptions, (err, order) => {
  //     console.log(order);
  //     console.log(err);
  //   //   // rzp1.order = order.order_id;
  //   //   // if (order && order.order_id) {
  //   //   //   rzp1.open();
  //   //   // }
  //   });
  // }
}
