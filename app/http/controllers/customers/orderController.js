const Order = require('../../../models/order')
const moment = require('moment')
// const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)


function orderController() {
    return {
        store(req, res) {
            // Validate request
            const { phone, address } = req.body
            if (!phone || !address) {
                req.flash('error', 'All fields are required')
                res.redirect('/cart');
            }

            const order = new Order({
                customerId: req.user._id,
                items: req.session.cart.items,
                phone: phone,
                address: address
            })
            order.save().then(result => {

                Order.populate(result, { path: 'customerId' }, (err, placedOrder) => {
                    req.flash('success', 'Order placed successfully')
                    delete req.session.cart

                    // Emit
                    const eventEmitter = req.app.get('eventEmitter')
                    eventEmitter.emit('orderPlaced', placedOrder)

                    return res.redirect('/customer/orders')
                })

            }).catch(err => {
                req.flash('error', 'Somethong went wrong')
                return res.redirect('/cart')
            })
        },


        async index(req, res) {
            //callback
            const orders = await Order.find({ customerId: req.user._id },
                null,
                { sort: { 'createdAt': -1 } })//sort new order placed first
            res.header('Cache-Control', 'no-store')
            res.render('customers/orders', { orders: orders, moment: moment })
        },


        async show(req, res) {
            const order = await Order.findById(req.params.id)//getting order details using 'id';


            // Check for  Authorize user
            if (req.user._id.toString() === order.customerId.toString()) {
                return res.render('customers/singleOrder', { order: order })
            }
            return res.redirect('/')
        }
    }
}

module.exports = orderController