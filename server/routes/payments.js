const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/payments/create-checkout ──────────────────────────────────────
// Creates a Stripe Checkout session for Pro subscription

router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    let customerId = req.user.stripeCustomerId;

    // Create a Stripe customer if they don't have one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user._id.toString() },
      });
      customerId = customer.id;

      await User.findByIdAndUpdate(req.user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?upgrade=canceled`,
      metadata: { userId: req.user._id.toString() },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/payments/subscription ──────────────────────────────────────────

router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscriptionId) {
      return res.json({ plan: 'free', subscription: null });
    }

    const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);

    res.json({
      plan: user.plan,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/payments/cancel ────────────────────────────────────────────────
// Cancels at period end (graceful cancel)

router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscriptionId) {
      return res.status(400).json({ message: 'No active subscription to cancel.' });
    }

    const subscription = await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({
      message: 'Subscription will be canceled at the end of the billing period.',
      cancelAt: new Date(subscription.cancel_at * 1000),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/payments/webhook ──────────────────────────────────────────────
// Stripe sends events here. Body must be raw (registered before express.json())

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (userId && session.subscription) {
        await User.findByIdAndUpdate(userId, {
          subscriptionId: session.subscription,
          plan: 'pro',
          subscriptionStatus: 'active',
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const user = await User.findOne({ stripeCustomerId: sub.customer });

      if (user) {
        await User.findByIdAndUpdate(user._id, {
          subscriptionStatus: sub.status,
          plan: sub.status === 'active' ? 'pro' : 'free',
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const user = await User.findOne({ stripeCustomerId: sub.customer });

      if (user) {
        await User.findByIdAndUpdate(user._id, {
          subscriptionId: null,
          plan: 'free',
          subscriptionStatus: 'canceled',
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const user = await User.findOne({ stripeCustomerId: invoice.customer });

      if (user) {
        await User.findByIdAndUpdate(user._id, { subscriptionStatus: 'past_due' });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
